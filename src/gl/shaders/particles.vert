precision highp float;

#define POKES 24
#define RADIUS 120.0
// импульсный отклик затухающей пружины: h(t) = e^(-DAMP·t) · sin(FREQ·t)
#define DAMP 3.4
#define FREQ 10.5
#define FAR 100.0
#define RANGE 98.0

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform vec2 uRes;          // CSS-пиксели
uniform float uTime;
uniform float uTravel;      // насколько поле уехало к камере
uniform float uSpeed;       // текущая скорость по z, для длины следа
uniform float uTanHalf;
uniform float uAspect;
uniform float uFade;
uniform float uPush;        // пикселей смещения на единицу силы
uniform float uWarp;
uniform vec4 uPokes[POKES]; // x, y (CSS px), время толчка, сила (0 — курсора нет)

in vec3 position;           // угол квада, -0.5..0.5
in vec3 aPos;               // u, v в долях экрана, глубина покоя
in vec4 aSeed;

out vec2 vLocal;
out vec2 vHalf;
out vec3 vColor;
out float vAlpha;

vec2 toPx(vec4 c) {
  vec2 n = c.xy / c.w;
  return vec2((n.x * 0.5 + 0.5) * uRes.x, (0.5 - n.y * 0.5) * uRes.y);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float depth0 = aPos.z;
  float lap = FAR - depth0 + uTravel;
  float z = -FAR + mod(lap, RANGE);
  float depth = -z;

  // xy привязаны к глубине покоя: в покое поле равномерно покрывает экран, при варпе разлетается радиально.
  // После «заворота» частица рождается вдали в новой случайной точке — без плотного кома в центре.
  vec2 uv = aPos.xy;
  float spread = depth0;
  float cycle = floor(lap / RANGE);
  if (cycle > 0.5) {
    uv = vec2(hash(aSeed.xy + cycle), hash(aSeed.zw + cycle * 1.7)) * 2.0 - 1.0;
    spread = FAR * sqrt(0.06 + 0.94 * hash(aSeed.yx + cycle * 2.3));
  }
  vec3 world = vec3(uv * vec2(uAspect, 1.0) * uTanHalf * spread * 1.12, z);
  vec4 clip = projectionMatrix * viewMatrix * vec4(world, 1.0);
  vec4 clipPrev = projectionMatrix * viewMatrix * vec4(world - vec3(0.0, 0.0, uSpeed * 0.03), 1.0);
  vec2 px = toPx(clip);
  vec2 trail = px - toPx(clipPrev);

  // отталкивание: сумма откликов пружины на недавние толчки курсора
  vec2 disp = vec2(0.0);
  for (int i = 0; i < POKES; i++) {
    vec4 p = uPokes[i];
    float tau = uTime - p.z;
    if (p.w <= 0.0 || tau <= 0.0) continue;
    vec2 d = px - p.xy;
    float dist = length(d);
    float f = 1.0 - smoothstep(0.0, RADIUS, dist);
    if (f <= 0.0) continue;
    disp += d / max(dist, 1.0) * f * p.w * exp(-DAMP * tau) * sin(FREQ * tau);
  }
  disp *= uPush * clamp(10.0 / depth, 0.7, 1.5);
  // оттолкнутая частица на мгновение «заряжается»: ярче, крупнее, теплее
  float energy = clamp(length(disp) / 70.0, 0.0, 1.0);

  float size = (0.9 + aSeed.x * aSeed.x * 2.4) * clamp(26.0 / depth, 0.6, 3.2) * (1.0 + energy * 0.6);
  float halfW = max(size * 0.5, 0.75) + 0.75;
  float len = length(trail);
  vec2 dir = len > 0.5 ? trail / len : vec2(1.0, 0.0);
  float halfL = halfW + len * 0.5;

  vec2 local = vec2(position.x * 2.0 * halfL, position.y * 2.0 * halfW);
  vec2 offset = dir * local.x + vec2(-dir.y, dir.x) * local.y - trail * 0.5 + disp;
  clip.xy += vec2(offset.x, -offset.y) / (uRes * 0.5) * clip.w;
  gl_Position = clip;

  vLocal = local;
  vHalf = vec2(halfL, halfW);

  float pick = aSeed.z;
  vColor = pick < 0.11 ? vec3(1.0, 0.62, 0.18)
         : pick < 0.17 ? vec3(0.18, 0.9, 1.0)
         : pick < 0.21 ? vec3(1.0, 0.25, 0.82)
         : vec3(0.8, 0.85, 1.0);
  vColor = mix(vColor, vec3(1.0, 0.68, 0.3), energy * 0.75);

  float twinkle = 0.72 + 0.28 * sin(uTime * (0.8 + aSeed.y * 2.6) + aSeed.w * 40.0);
  float fade = (1.0 - smoothstep(FAR - 18.0, FAR, depth)) * smoothstep(1.2, 4.0, depth);
  float streak = mix(1.0, sqrt(halfW / halfL), 0.7);
  vAlpha = mix(0.42, 1.0, aSeed.w) * twinkle * fade * streak * uFade * (1.0 + uWarp * 0.8) * (1.0 + energy * 1.6);
}
