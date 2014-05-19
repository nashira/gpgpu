
precision highp float;

const float xsize = #{xsize};
const float ysize = #{ysize};
const float xiter = #{xiter};
const float yiter = #{yiter};
const float ymax = #{ymax};

uniform sampler2D positionTexture;
uniform sampler2D previousTexture;
uniform sampler2D forceTexture;

uniform float xstart;
uniform float ystart;
uniform float dt;

attribute vec2 coords;

varying vec3 vPos;


vec3 bruteForce(vec3 pos) {
  vec3 f = vec3(0.);
  for (float y = yiter; y < ymax; y += ysize) {
    for (float x = xiter; x < 1.0; x += xsize) {
      vec4 otherPosition = texture2D(positionTexture, vec2(x + xstart, y + ystart));
      vec3 diff = otherPosition.xyz - pos.xyz;
      float a = dot(diff, diff) + 0.0001;
      f += diff / a;
    }
  }
  return f;
}

void main() {
  vec3 pos = texture2D(positionTexture, coords).xyz;
  vec3 pre = texture2D(previousTexture, coords).xyz;
  vec3 force = texture2D(forceTexture, coords).xyz;

  vec3 f = bruteForce(pos);
  // vec3 npos = 2. * pos - pre - f * dt;
  vec3 npos = pos - f * dt;

  vPos = npos + force;

  gl_Position = vec4(coords * 2. - 1., 0.0, 1.0);
}
