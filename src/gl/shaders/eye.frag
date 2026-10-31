precision highp float;

#define PI 3.14159265
#define IRIS 0.62     // угловой радиус радужки, рад
#define IRIS_R 0.581  // sin(IRIS): радиус радужки в плоскости xy

uniform float uTime;
uniform float uPupil;  // радиус зрачка в долях радужки
uniform float uBright; // 0..1 — проявление при сборке

in vec3 vObj;
in vec3 vN;
in vec3 vV;
in vec3 vVo;

out vec4 fragColor;

const vec3 GREEN = vec3(0.224, 1.0, 0.533);
const vec3 MAGENTA = vec3(1.0, 0.184, 0.816);
const vec3 AMBER = vec3(1.0, 0.616, 0.18);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// «хребтовый» шум — тонкие ветвящиеся линии для сосудов
float ridge(vec2 p) {
  float v = 0.0;
  float a = 0.6;
  for (int i = 0; i < 3; i++) {
    v += a * pow(1.0 - abs(noise(p) * 2.0 - 1.0), 6.0);
    p = p * 2.1 + 3.7;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 n = normalize(vObj);
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);
  vec3 Vo = normalize(vVo);
  float theta = acos(clamp(n.z, -1.0, 1.0));
  float ndv = max(dot(N, V), 0.0);
  float fres = pow(1.0 - ndv, 3.0);

  vec3 L = normalize(vec3(-0.5, 0.65, 0.6)); // ключевой свет сверху слева
  float diff = max(dot(N, L), 0.0);

  // ---------- склера: влажный белок, сосуды к периферии, тень от оболочки ----------
  vec2 around = normalize(n.xy + 1e-5);
  float veins = ridge(around * 4.0 + vec2(theta * 3.0, -theta * 2.2)) * smoothstep(IRIS * 1.2, IRIS * 2.1, theta);
  float blot = noise(around * 3.0 + theta * 2.0); // неравномерный тон белка
  vec3 sclera = mix(vec3(0.88, 0.85, 0.82), vec3(0.8, 0.7, 0.72), smoothstep(0.85, 1.6, theta) * 0.7);
  sclera *= 0.9 + 0.1 * blot;
  sclera = mix(sclera, vec3(0.7, 0.13, 0.14), clamp(veins * 1.3, 0.0, 0.9));
  float ao = mix(1.0, 0.2, smoothstep(0.92, 1.42, theta));   // под панелями оболочки темно
  ao *= mix(0.72, 1.0, smoothstep(IRIS, IRIS * 1.35, theta)); // тень у края роговицы
  sclera *= (0.14 + 0.86 * diff) * ao * 0.64;

  // ---------- радужка: лежит под роговицей, при взгляде сбоку смещается (параллакс) ----------
  float cap = 1.0 - smoothstep(0.0, IRIS * 1.1, theta);
  vec2 q = n.xy - Vo.xy / max(Vo.z, 0.35) * 0.07 * cap;
  float rr = length(q) / IRIS_R;
  vec2 dir = q / max(length(q), 1e-5);
  float wob = noise(dir * 6.0) - 0.5;
  float pupilR = uPupil * (1.0 + wob * 0.05);
  float phi = atan(dir.y, dir.x);
  float collar = pupilR + 0.2 + 0.035 * sin(phi * 14.0 + wob * 5.0); // зубчатый воротничок

  float fib = 0.5 * noise(dir * 26.0 + rr * 2.0) + 0.3 * noise(dir * 61.0 + rr * 5.0) + 0.2 * noise(dir * 140.0 + rr * 9.0);
  float crypt = smoothstep(0.6, 0.82, noise(dir * 9.0 + vec2(rr * 5.0, -rr * 4.0))) * smoothstep(0.32, 0.5, rr) * (1.0 - smoothstep(0.78, 0.94, rr));

  // тёмные радиальные борозды и светлые волокна поверх базового узора
  float furrow = pow(noise(dir * 44.0 + rr * 0.6), 3.0);
  float strand = pow(noise(dir * 90.0 + rr * 3.0), 4.0);

  vec3 inner = mix(vec3(0.42, 0.2, 0.05), AMBER * 1.1, fib * fib * 1.4);       // золотисто-карий центр
  vec3 outer = mix(vec3(0.02, 0.2, 0.15), vec3(0.16, 0.74, 0.5), fib);         // зелёная периферия
  outer += GREEN * strand * 0.35;
  float blend = smoothstep(collar - 0.06, collar + 0.12, rr + (fib - 0.5) * 0.08);
  vec3 iris = mix(inner, outer, blend);
  iris += AMBER * 0.22 * (1.0 - smoothstep(0.0, 0.025, abs(rr - collar)));
  iris *= 1.0 - furrow * 0.55;
  iris *= 1.0 - crypt * 0.65;
  iris *= 0.88 + 0.12 * sin(rr * 64.0 + fib * 4.0) * smoothstep(0.62, 0.86, rr); // контракционные бороздки
  iris = mix(iris, vec3(0.008, 0.04, 0.035), smoothstep(0.82, 1.0, rr));          // тёмный лимб
  iris *= 0.42 + 0.7 * diff;

  // кибер-деталь: тонкий пунктир сканера поверх радужки
  float hud = (1.0 - smoothstep(0.0, 0.012, abs(rr - 0.72))) * step(0.45, fract(phi / (2.0 * PI) * 36.0 + uTime * 0.05));
  iris += GREEN * hud * 0.3;

  // зрачок с тёмной бахромой по краю
  iris *= mix(1.0, 0.3, 1.0 - smoothstep(pupilR, pupilR + 0.07, rr));
  iris = mix(iris, vec3(0.0), 1.0 - smoothstep(pupilR - 0.012, pupilR + 0.012, rr));

  vec3 color = mix(sclera, iris, 1.0 - smoothstep(0.985, 1.025, rr));
  color += GREEN * (1.0 - smoothstep(0.0, 0.02, abs(rr - 1.0))) * 0.3 * (0.4 + 0.6 * diff); // неоновая нить лимба

  // ---------- роговица и влага: отражения среды и блики ----------
  vec3 R = reflect(-V, N);
  vec3 env = mix(vec3(0.012, 0.016, 0.024), vec3(0.07, 0.09, 0.12), R.y * 0.5 + 0.5);
  env += MAGENTA * 0.09 * smoothstep(0.1, 0.9, -R.x) + GREEN * 0.07 * smoothstep(0.1, 0.9, R.x);
  color += env * (0.3 + 0.7 * fres);

  float cornea = 1.0 - smoothstep(IRIS * 0.95, IRIS * 1.2, theta);
  float rl = max(dot(R, L), 0.0);
  color += vec3(1.0, 0.98, 0.95) * (pow(rl, 700.0) * 2.4 * cornea + pow(rl, 40.0) * 0.1);

  // мягкий вытянутый отблеск софтбокса — «живой» блик без переплёта
  vec3 W = normalize(vec3(-0.34, 0.42, 0.84));
  vec2 w = (R.xy - W.xy) / vec2(0.13, 0.06);
  float box = 1.0 - smoothstep(0.55, 1.0, length(w * vec2(0.85, 1.0)));
  box *= 0.75 + 0.25 * smoothstep(-1.0, 1.0, w.y); // к верху чуть ярче
  color += vec3(0.88, 0.93, 1.0) * box * 0.55 * cornea;

  // неоновый отсвет снизу справа и контровой ободок
  vec3 L2 = normalize(vec3(0.6, -0.35, 0.7));
  color += mix(MAGENTA, vec3(1.0), 0.45) * pow(max(dot(R, L2), 0.0), 300.0) * 0.55 * cornea;
  color += mix(MAGENTA, GREEN, 0.5 + 0.5 * N.y) * fres * 0.3;

  fragColor = vec4(color * uBright, 1.0);
}
