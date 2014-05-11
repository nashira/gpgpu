
precision highp float;

uniform float lod;
varying vec3 vPos;

void main() {
  gl_FragColor = vec4(vPos, 1.);
}
