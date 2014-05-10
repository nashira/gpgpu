
precision highp float;

uniform sampler2D dataTexture;
attribute vec2 coords;
varying vec3 vColor;

void main() {
  vec3 data = texture2D(dataTexture, coords).xyz;
  vColor = data;
  gl_PointSize = 20.;
  gl_Position = vec4(data, 1.);
}
