precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

in vec3 position;
in vec3 normal;

out vec3 vObj;
out vec3 vN;
out vec3 vV;
out vec3 vVo; // направление на камеру в пространстве глаза — для параллакса радужки под роговицей

void main() {
  vObj = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  // transpose(normalMatrix) = inverse(mat3(modelView)): из вида обратно в объект
  vVo = transpose(normalMatrix) * vV;
  gl_Position = projectionMatrix * mv;
}
