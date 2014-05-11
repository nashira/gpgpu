
precision highp float;

uniform float lod;
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(abs(vColor * .1 * (lod + 1.)), 1.);
}
