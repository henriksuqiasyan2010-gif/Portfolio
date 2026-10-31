precision highp float;

// Раздельный гаусс (5 выборок с линейной фильтрацией ≈ 9 тапов); в первом проходе — порог яркости.
uniform sampler2D tMap;
uniform vec2 uDir;
uniform float uThreshold; // 0 — без порога

in vec2 vUv;

out vec4 fragColor;

vec3 tap(vec2 uv) {
  vec3 c = texture(tMap, uv).rgb;
  if (uThreshold > 0.0) {
    float l = max(c.r, max(c.g, c.b));
    c *= smoothstep(uThreshold, uThreshold + 0.3, l);
  }
  return c;
}

void main() {
  vec3 c = tap(vUv) * 0.227027;
  c += (tap(vUv + uDir * 1.3846) + tap(vUv - uDir * 1.3846)) * 0.316216;
  c += (tap(vUv + uDir * 3.2308) + tap(vUv - uDir * 3.2308)) * 0.070270;
  fragColor = vec4(c, 1.0);
}
