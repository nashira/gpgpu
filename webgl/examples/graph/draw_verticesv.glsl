
precision highp float;

uniform sampler2D positionTexture;
uniform mat4 matrix;

attribute vec2 coords;
attribute vec3 color;

varying vec3 vColor;

void main() {
  vec3 pos = texture2D(positionTexture, coords).xyz;

  vColor = color;

  gl_PointSize = 5.;

  gl_Position = matrix * vec4(pos, 1.0);
}
