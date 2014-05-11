
precision highp float;

uniform sampler2D positionTexture;
uniform sampler2D previousTexture;
uniform sampler2D octreeTexture;
uniform float size;
uniform float slicesPerRow;
uniform float numRows;
uniform float lod;
uniform vec2 sliceSize;

attribute vec2 coords;

varying vec3 vPos;

vec2 computeSliceOffset(float slice, vec2 sliceSize) {
  return sliceSize * vec2(mod(slice, slicesPerRow),
                          floor(slice / slicesPerRow));
}

vec4 texture3DLod0(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float start = floor(texCoord.z * size);

  vec2 uv = texCoord.xy * sliceSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);

  return texture2DLod(octreeTexture, slice0 + uv, lod);
}

vec4 texture3DLod1(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size * .5;
  float start = floor(texCoord.z * lsize) * 2.;

  vec2 uv = texCoord.xy * sliceSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1.0, sliceSize);
  return mix(texture2DLod(octreeTexture, slice0 + uv, lod),
          texture2DLod(octreeTexture, slice1 + uv, lod), 0.5);
}

vec4 texture3DLod2(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size * .25;
  float start = floor(texCoord.z * lsize) * 4.;

  vec2 uv = texCoord.xy * sliceSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1., sliceSize);
  vec2 slice2 = computeSliceOffset(start + 2., sliceSize);
  vec2 slice3 = computeSliceOffset(start + 3., sliceSize);
  vec4 sample = texture2DLod(octreeTexture, slice0 + uv, lod);
  sample += texture2DLod(octreeTexture, slice1 + uv, lod);
  sample += texture2DLod(octreeTexture, slice2 + uv, lod);
  sample += texture2DLod(octreeTexture, slice3 + uv, lod);
  sample *= .25;
  return sample;
}

vec4 texture3DLod3(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size * .125;
  float start = floor(texCoord.z * lsize) * 8.;

  vec2 uv = texCoord.xy * sliceSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1., sliceSize);
  vec2 slice2 = computeSliceOffset(start + 2., sliceSize);
  vec2 slice3 = computeSliceOffset(start + 3., sliceSize);
  vec2 slice4 = computeSliceOffset(start + 4., sliceSize);
  vec2 slice5 = computeSliceOffset(start + 5., sliceSize);
  vec2 slice6 = computeSliceOffset(start + 6., sliceSize);
  vec2 slice7 = computeSliceOffset(start + 7., sliceSize);
  vec4 sample = texture2DLod(octreeTexture, slice0 + uv, lod);
  sample += texture2DLod(octreeTexture, slice1 + uv, lod);
  sample += texture2DLod(octreeTexture, slice2 + uv, lod);
  sample += texture2DLod(octreeTexture, slice3 + uv, lod);
  sample += texture2DLod(octreeTexture, slice4 + uv, lod);
  sample += texture2DLod(octreeTexture, slice5 + uv, lod);
  sample += texture2DLod(octreeTexture, slice6 + uv, lod);
  sample += texture2DLod(octreeTexture, slice7 + uv, lod);
  sample *= .125;
  return sample;
}

vec4 texture3DLod4(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size * .0625;
  float start = floor(texCoord.z * lsize) * 16.;

  vec2 uv = texCoord.xy * sliceSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1., sliceSize);
  vec2 slice2 = computeSliceOffset(start + 2., sliceSize);
  vec2 slice3 = computeSliceOffset(start + 3., sliceSize);
  vec2 slice4 = computeSliceOffset(start + 4., sliceSize);
  vec2 slice5 = computeSliceOffset(start + 5., sliceSize);
  vec2 slice6 = computeSliceOffset(start + 6., sliceSize);
  vec2 slice7 = computeSliceOffset(start + 7., sliceSize);
  vec2 slice8 = computeSliceOffset(start + 8., sliceSize);
  vec2 slice9 = computeSliceOffset(start + 9., sliceSize);
  vec2 slice10 = computeSliceOffset(start + 10., sliceSize);
  vec2 slice11 = computeSliceOffset(start + 11., sliceSize);
  vec2 slice12 = computeSliceOffset(start + 12., sliceSize);
  vec2 slice13 = computeSliceOffset(start + 13., sliceSize);
  vec2 slice14 = computeSliceOffset(start + 14., sliceSize);
  vec2 slice15 = computeSliceOffset(start + 15., sliceSize);
  vec4 sample = texture2DLod(octreeTexture, slice0 + uv, lod);
  sample += texture2DLod(octreeTexture, slice1 + uv, lod);
  sample += texture2DLod(octreeTexture, slice2 + uv, lod);
  sample += texture2DLod(octreeTexture, slice3 + uv, lod);
  sample += texture2DLod(octreeTexture, slice4 + uv, lod);
  sample += texture2DLod(octreeTexture, slice5 + uv, lod);
  sample += texture2DLod(octreeTexture, slice6 + uv, lod);
  sample += texture2DLod(octreeTexture, slice7 + uv, lod);
  sample += texture2DLod(octreeTexture, slice8 + uv, lod);
  sample += texture2DLod(octreeTexture, slice9 + uv, lod);
  sample += texture2DLod(octreeTexture, slice10 + uv, lod);
  sample += texture2DLod(octreeTexture, slice11 + uv, lod);
  sample += texture2DLod(octreeTexture, slice12 + uv, lod);
  sample += texture2DLod(octreeTexture, slice13 + uv, lod);
  sample += texture2DLod(octreeTexture, slice14 + uv, lod);
  sample += texture2DLod(octreeTexture, slice15 + uv, lod);
  sample *= .0625;
  return sample;
}

vec3 getN2Force(vec3 pos) {
  vec3 f = vec3(0.);
  for (float y = 0.01562 * .5; y < 1.0; y += 0.015625) {
    for (float x = 0.015625 * .5; x < 1.0; x += 0.015625) {
      vec4 otherPosition = texture2D(positionTexture, vec2(x, y));
      vec3 diff = otherPosition.xyz - pos.xyz;
      float a = dot(diff, diff) + 0.01;
      f += diff / (a * sqrt(a));
    }
  }
  return f;
}

void main() {
  vec3 pos = texture2D(positionTexture, coords).xyz;
  vec3 pre = texture2D(previousTexture, coords).xyz;
  vec4 color;
  // if (lod < 1.0) {
  //   color = texture3DLod0(pos);
  // } else if (lod < 2.0) {
  //   color = texture3DLod1(pos);
  // } else if (lod < 3.0) {
  //   color = texture3DLod2(pos);
  // } else if (lod < 4.0) {
  //   color = texture3DLod3(pos);
  // } else {
  //   color = texture3DLod4(pos);
  // }

  vec3 f = getN2Force(pos);
  vec3 npos = 2. * pos - pre + f * 0.000000001;

  vPos = clamp(npos, vec3(-1.), vec3(1.));

  // vPos = pos;

  gl_Position = vec4(coords * 2. - 1., 0.0, 1.0);
}
