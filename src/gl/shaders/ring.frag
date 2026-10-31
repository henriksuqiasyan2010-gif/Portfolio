precision highp float;

uniform float uTime;
uniform float uBright;
uniform vec3 uColor;

in float vT;
in float vDepth;

out vec4 fragColor;

void main() {
  // штрихи разной длины и бегущий яркий сегмент — как шкала прицела
  float dash = step(0.45, fract(vT * 64.0));
  float tick = step(0.9, fract(vT * 8.0));
  float runner = smoothstep(0.12, 0.0, abs(fract(vT - uTime * 0.06) - 0.5) - 0.38);
  float a = max(dash * 0.35, tick) + runner * 0.9;
  if (a < 0.01) discard;
  fragColor = vec4(uColor * a * uBright, 1.0);
}
