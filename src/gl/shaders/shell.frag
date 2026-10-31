precision highp float;

uniform float uTime;
uniform float uBright;

in vec3 vBary;
in vec3 vN;
in vec3 vV;
in vec3 vDir;
in float vOpen;
in float vRand;

out vec4 fragColor;

const vec3 GREEN = vec3(0.224, 1.0, 0.533);
const vec3 MAGENTA = vec3(1.0, 0.184, 0.816);

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(vV);

  // неоновое ребро по барицентрическим координатам: тонкая линия + мягкий ореол у края
  float e = min(min(vBary.x, vBary.y), vBary.z);
  float w = fwidth(e);
  float line = 1.0 - smoothstep(w * 0.5, w * 1.8, e);
  float halo = 1.0 - smoothstep(0.0, 0.09, e);

  float pulse = 0.65 + 0.35 * sin(uTime * 1.4 + vRand * 6.2831);
  vec3 neon = mix(GREEN, MAGENTA, smoothstep(-0.7, 0.7, vDir.y + sin(uTime * 0.5 + vRand * 3.0) * 0.35));

  vec3 L = normalize(vec3(-0.4, 0.6, 0.7));
  float diff = 0.25 + 0.75 * max(dot(N, L), 0.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.0);
  vec3 body = vec3(0.05, 0.05, 0.08) * diff + neon * fres * 0.12;

  // раскрывающиеся панели «искрят» ярче
  float energy = 1.0 + vOpen * 1.2;
  vec3 color = body + neon * (line * 1.25 + halo * 0.16) * pulse * energy;
  fragColor = vec4(color * uBright, 1.0);
}
