
precision highp float;

uniform sampler2D positionTexture;
uniform float forceDir;
uniform float dt;

attribute vec4 coords;

varying vec3 vPos;

void main() {
  vec3 posOut = texture2D(positionTexture, coords.xy).xyz;
  vec3 posIn = texture2D(positionTexture, coords.zw).xyz;

  vec3 f = (posIn - posOut) * dt;

  // vPos = vec3(0.);
  if (forceDir > 0.5) {
    vPos = f;
    gl_Position = vec4(coords.xy * 2. - 1., 0.0, 1.0);
  } else {
    vPos = -f;
    gl_Position = vec4(coords.zw * 2. - 1., 0.0, 1.0);
  }
}
