precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat3 uSpin;     // собственное вращение оболочки
uniform float uBlink;   // 1 — панели сомкнуты над радужкой
uniform float uAssemble;

in vec3 position;
in vec3 aCenter;
in vec3 aBary;
in float aRand;

out vec3 vBary;
out vec3 vN;
out vec3 vV;
out vec3 vDir;
out float vOpen;
out float vRand;

void main() {
  vec3 c = uSpin * aCenter;
  vec3 p = uSpin * position;
  vec3 dir = normalize(c);

  // апертура: панели в ~40° от оси взгляда раскрыты; моргание закрывает их от края к центру
  float open = smoothstep(0.68, 0.87, dir.z);
  float closeAt = smoothstep(0.66, 1.0, dir.z);
  open *= 1.0 - smoothstep(closeAt * 0.45, closeAt * 0.45 + 0.35, uBlink);

  // раскрытая панель сжимается к своему центру и отъезжает наружу
  float scale = mix(0.9, 0.0, open);
  vec3 center = c + dir * open * 0.22;

  // сборка при появлении секции: панели слетаются издалека, каждая со своей задержкой
  float a = clamp(uAssemble * 1.7 - aRand * 0.7, 0.0, 1.0);
  a = a * a * (3.0 - 2.0 * a);
  center += dir * (1.0 - a) * (2.2 + aRand * 3.5);
  scale *= a;

  vec3 pos = center + (p - c) * scale;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  vBary = aBary;
  vN = normalize(normalMatrix * dir);
  vV = -mv.xyz;
  vDir = dir;
  vOpen = open;
  vRand = aRand;
}
