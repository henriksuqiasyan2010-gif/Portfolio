precision highp float;

// Medium: мягкий ореол спрайтом вместо bloom
uniform float uTime;
uniform float uBright;

in vec2 vUv;

out vec4 fragColor;

const vec3 GREEN = vec3(0.224, 1.0, 0.533);
const vec3 MAGENTA = vec3(1.0, 0.184, 0.816);

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float core = exp(-r * r * 9.0);
  float halo = exp(-r * r * 3.2);
  float pulse = 0.85 + 0.15 * sin(uTime * 1.1);
  vec3 c = MAGENTA * core * 0.22 + mix(GREEN, MAGENTA, 0.5 + 0.5 * p.y) * halo * 0.12;
  fragColor = vec4(c * pulse * uBright, 1.0);
}
