precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

in vec3 position;
in float aT; // 0..1 по окружности

out float vT;
out float vDepth;

void main() {
  vT = aT;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = position.z;
  gl_Position = projectionMatrix * mv;
}
