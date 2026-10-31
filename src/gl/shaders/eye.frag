precision highp float;

#define PI 3.14159265
#define IRIS 0.62 // угловой радиус радужки, рад

uniform float uTime;
uniform float uPupil;  // радиус зрачка в долях радужки
uniform float uBright; // 0..1 — проявление при сборке

in vec3 vObj;
in vec3 vN;
in vec3 vV;

out vec4 fragColor;

const vec3 GREEN = vec3(0.224, 1.0, 0.533);
const vec3 MAGENTA = vec3(1.0, 0.184, 0.816);
const vec3 CYAN = vec3(0.18, 0.9, 1.0);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// линия сетки толщиной ~1px независимо от масштаба
float gridLine(float x, float scale) {
  float v = x * scale;
  float d = abs(fract(v - 0.5) - 0.5); // расстояние до ближайшей линии
  float w = min(fwidth(v), 0.25);      // на шве atan fwidth взлетает — ограничиваем
  return 1.0 - smoothstep(0.0, w * 1.2, d);
}

void main() {
  vec3 n = normalize(vObj);
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  float theta = acos(clamp(n.z, -1.0, 1.0));
  float r = theta / IRIS;
  float phi = atan(n.y, n.x);
  vec2 ring = vec2(cos(phi), sin(phi)); // непрерывно по кругу — без шва на ±π
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);

  // склера: тёмный металл с тонкой сеткой
  float grid = max(gridLine(theta / PI, 14.0), gridLine(phi / PI, 12.0)) * smoothstep(1.1, 1.6, r);
  vec3 sclera = vec3(0.04, 0.04, 0.065) + CYAN * grid * 0.18;
  sclera += mix(MAGENTA, GREEN, 0.5 + 0.5 * n.y) * fres * 0.55;

  // радужка: радиальный градиент + волокна из шума
  float fib = noise(ring * 7.0 + vec2(r * 1.6, -r * 1.2)) * 0.55 + noise(ring * 23.0 + vec2(r * 4.0, uTime * 0.05)) * 0.45;
  vec3 iris = mix(MAGENTA, GREEN, smoothstep(0.2, 0.92, r + (fib - 0.5) * 0.3));
  iris *= 0.45 + 0.85 * fib;
  iris += MAGENTA * (1.0 - smoothstep(0.0, 0.07, abs(r - (uPupil + 0.13)))) * 0.55; // воротничок
  iris *= 1.0 - smoothstep(0.84, 1.0, r) * 0.7;                                   // тёмный лимб

  // HUD-кольцо внутри радужки: пунктир медленно вращается
  float hud = 1.0 - smoothstep(0.0, 0.022, abs(r - 0.76));
  float dash = step(0.38, fract(phi / (2.0 * PI) * 28.0 + uTime * 0.07));
  iris += GREEN * hud * dash * 0.85;

  // зрачок и его магентовый ободок
  float pupil = 1.0 - smoothstep(uPupil - 0.015, uPupil + 0.015, r);
  iris = mix(iris, vec3(0.0, 0.0, 0.01), pupil);
  iris += MAGENTA * (1.0 - smoothstep(0.0, 0.045, abs(r - uPupil))) * 0.9;

  vec3 color = mix(sclera, iris, 1.0 - smoothstep(0.98, 1.03, r));
  color += GREEN * (1.0 - smoothstep(0.0, 0.035, abs(r - 1.0))) * 1.05; // неоновый край радужки

  // блик
  vec3 L = normalize(vec3(-0.45, 0.55, 0.75));
  vec3 H = normalize(L + V);
  color += vec3(1.0, 0.97, 0.95) * pow(max(dot(N, H), 0.0), 120.0) * 0.95;

  fragColor = vec4(color * uBright, 1.0);
}
