
precision highp float;

uniform sampler2D tex;
varying vec2 vPos;

void main() {
  vec3 color = texture2D(tex, vPos).xyz;
  gl_FragColor = vec4(color, 1.);
}
