precision highp float;

in vec2 vLocal;
in vec2 vHalf;
in vec3 vColor;
in float vAlpha;

out vec4 fragColor;

void main() {
  // капсула в пикселях: точка в покое, полоска при варпе
  vec2 p = vec2(max(abs(vLocal.x) - (vHalf.x - vHalf.y), 0.0), vLocal.y);
  float d = length(p);
  float r = vHalf.y;
  float edge = 1.0 - smoothstep(r - 1.0, r, d);
  float core = exp(-4.0 * d * d / (r * r));
  float a = (edge * 0.45 + core * 0.75) * vAlpha;
  if (a < 0.003) discard;
  fragColor = vec4(vColor, a);
}
