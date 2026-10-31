precision highp float;

uniform sampler2D tMap;
uniform float uStrength;

in vec2 vUv;

out vec4 fragColor;

void main() {
  fragColor = vec4(texture(tMap, vUv).rgb * uStrength, 1.0);
}
