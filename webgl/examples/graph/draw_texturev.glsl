
precision highp float;

uniform sampler2D positionTexture;
uniform sampler2D octreeTexture;
uniform float size;
uniform float slicesPerRow;
uniform float numRows;
uniform float lod;
uniform vec2 sliceSize;
uniform vec2 slicePixelSize;
uniform vec2 sliceInnerSize;
uniform mat4 matrix;

attribute vec2 coords;

varying vec3 vColor;

vec2 computeSliceOffset(float slice, vec2 sliceSize) {
  return sliceSize * vec2(mod(slice, slicesPerRow),
                          floor(slice / slicesPerRow));
}

vec4 texture3DLod0(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float start = floor(texCoord.z * size);

  vec2 uv = slicePixelSize * 0.5 + texCoord.xy * sliceInnerSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);

  return texture2DLod(octreeTexture, slice0 + uv, lod);
}

vec4 texture3DLod1(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size / 2.;
  float start = floor(texCoord.z * lsize) * 2.;

  vec2 uv = slicePixelSize * 0.5 + texCoord.xy * sliceInnerSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1.0, sliceSize);
  return mix(texture2DLod(octreeTexture, slice0 + uv, lod),
          texture2DLod(octreeTexture, slice1 + uv, lod), 0.5);
}

vec4 texture3DLod2(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size / 4.;
  float start = floor(texCoord.z * lsize) * 4.;

  vec2 uv = slicePixelSize * .5 + texCoord.xy * sliceInnerSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1., sliceSize);
  vec2 slice2 = computeSliceOffset(start + 2., sliceSize);
  vec2 slice3 = computeSliceOffset(start + 3., sliceSize);
  vec4 c1 = mix(texture2DLod(octreeTexture, slice0 + uv, lod),
          texture2DLod(octreeTexture, slice1 + uv, lod), .5);
  vec4 c2 = mix(texture2DLod(octreeTexture, slice2 + uv, lod),
          texture2DLod(octreeTexture, slice3 + uv, lod), .5);
  return mix(c1, c2, .5);
}

vec4 texture3DLod3(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size / 8.;
  float start = floor(texCoord.z * lsize) * 8.;

  vec2 uv = slicePixelSize * .5 + texCoord.xy * sliceInnerSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1., sliceSize);
  vec2 slice2 = computeSliceOffset(start + 2., sliceSize);
  vec2 slice3 = computeSliceOffset(start + 3., sliceSize);
  vec2 slice4 = computeSliceOffset(start + 4., sliceSize);
  vec2 slice5 = computeSliceOffset(start + 5., sliceSize);
  vec2 slice6 = computeSliceOffset(start + 6., sliceSize);
  vec2 slice7 = computeSliceOffset(start + 7., sliceSize);
  vec4 c1 = mix(texture2DLod(octreeTexture, slice0 + uv, lod),
          texture2DLod(octreeTexture, slice1 + uv, lod), .5);
  vec4 c2 = mix(texture2DLod(octreeTexture, slice2 + uv, lod),
          texture2DLod(octreeTexture, slice3 + uv, lod), .5);
  vec4 c3 = mix(texture2DLod(octreeTexture, slice4 + uv, lod),
          texture2DLod(octreeTexture, slice5 + uv, lod), .5);
  vec4 c4 = mix(texture2DLod(octreeTexture, slice6 + uv, lod),
          texture2DLod(octreeTexture, slice7 + uv, lod), .5);
  return mix(mix(c1, c2, .5), mix(c3, c4, .5), .5);
}

vec4 texture3DLod4(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size / 8.;
  float start = floor(texCoord.z * lsize) * 8.;

  vec2 uv = slicePixelSize * .5 + texCoord.xy * sliceInnerSize;

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
  vec4 c1 = mix(texture2DLod(octreeTexture, slice0 + uv, lod),
          texture2DLod(octreeTexture, slice1 + uv, lod), .5);
  vec4 c2 = mix(texture2DLod(octreeTexture, slice2 + uv, lod),
          texture2DLod(octreeTexture, slice3 + uv, lod), .5);
  vec4 c3 = mix(texture2DLod(octreeTexture, slice4 + uv, lod),
          texture2DLod(octreeTexture, slice5 + uv, lod), .5);
  vec4 c4 = mix(texture2DLod(octreeTexture, slice6 + uv, lod),
          texture2DLod(octreeTexture, slice7 + uv, lod), .5);
  vec4 c5 = mix(texture2DLod(octreeTexture, slice8 + uv, lod),
          texture2DLod(octreeTexture, slice9 + uv, lod), .5);
  vec4 c6 = mix(texture2DLod(octreeTexture, slice10 + uv, lod),
          texture2DLod(octreeTexture, slice11 + uv, lod), .5);
  vec4 c7 = mix(texture2DLod(octreeTexture, slice12 + uv, lod),
          texture2DLod(octreeTexture, slice13 + uv, lod), .5);
  vec4 c8 = mix(texture2DLod(octreeTexture, slice14 + uv, lod),
          texture2DLod(octreeTexture, slice15 + uv, lod), .5);
  return mix(mix(mix(c1, c2, .5), mix(c3, c4, .5), .5), mix(mix(c5, c6, .5), mix(c7, c8, .5), .5), .5);
}

void main() {
  vec3 pos = texture2D(positionTexture, coords).xyz;
  vec4 color;
  if (lod < 1.0) {
    color = texture3DLod0(pos);
  } else if (lod < 2.0) {
    color = texture3DLod1(pos);
  } else if (lod < 3.0) {
    color = texture3DLod2(pos);
  } else if (lod < 4.0) {
    color = texture3DLod3(pos);
  } else {
    color = texture3DLod4(pos);
  }

  vColor = color.xyz;
  gl_PointSize = 3.;
  // gl_Position = vec4(coords * 2. - 1., 0.0, 1.0);
  gl_Position = matrix * vec4(pos, 1.0);
}
