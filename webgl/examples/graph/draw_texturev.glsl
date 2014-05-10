
precision highp float;

uniform sampler2D tex;
uniform float lod;
attribute vec2 coords;

varying vec3 vColor;

void main() {
  vColor = texture2DLod(tex, coords, lod).xyz;
  gl_PointSize = 15.;
  gl_Position = vec4(coords * 2. - 1., 0.0, 1.0);
}
