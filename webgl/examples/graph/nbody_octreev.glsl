
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

  return texture2DLod(octreeTexture, slice0 + uv, 0.);
}

vec4 texture3DLod1(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size * .5;
  float start = floor(texCoord.z * lsize) * 2.;

  vec2 uv = texCoord.xy * sliceSize;

  vec2 slice0 = computeSliceOffset(start, sliceSize);
  vec2 slice1 = computeSliceOffset(start + 1.0, sliceSize);
  return mix(texture2DLod(octreeTexture, slice0 + uv, 1.),
          texture2DLod(octreeTexture, slice1 + uv, 1.), 0.5);
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
  vec4 sample = texture2DLod(octreeTexture, slice0 + uv, 2.);
  sample += texture2DLod(octreeTexture, slice1 + uv, 2.);
  sample += texture2DLod(octreeTexture, slice2 + uv, 2.);
  sample += texture2DLod(octreeTexture, slice3 + uv, 2.);
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
  vec4 sample = texture2DLod(octreeTexture, slice0 + uv, 3.);
  sample += texture2DLod(octreeTexture, slice1 + uv, 3.);
  sample += texture2DLod(octreeTexture, slice2 + uv, 3.);
  sample += texture2DLod(octreeTexture, slice3 + uv, 3.);
  sample += texture2DLod(octreeTexture, slice4 + uv, 3.);
  sample += texture2DLod(octreeTexture, slice5 + uv, 3.);
  sample += texture2DLod(octreeTexture, slice6 + uv, 3.);
  sample += texture2DLod(octreeTexture, slice7 + uv, 3.);
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
  vec4 sample = texture2DLod(octreeTexture, slice0 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice1 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice2 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice3 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice4 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice5 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice6 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice7 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice8 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice9 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice10 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice11 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice12 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice13 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice14 + uv, 4.);
  sample += texture2DLod(octreeTexture, slice15 + uv, 4.);
  sample *= .0625;
  return sample;
}

vec4 texture3DLod5(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;

  float lsize = size * .03125;
  float start = floor(texCoord.z * lsize) * 32.;

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
  vec2 slice16 = computeSliceOffset(start + 16., sliceSize);
  vec2 slice17 = computeSliceOffset(start + 17., sliceSize);
  vec2 slice18 = computeSliceOffset(start + 18., sliceSize);
  vec2 slice19 = computeSliceOffset(start + 19., sliceSize);
  vec2 slice20 = computeSliceOffset(start + 20., sliceSize);
  vec2 slice21 = computeSliceOffset(start + 21., sliceSize);
  vec2 slice22 = computeSliceOffset(start + 22., sliceSize);
  vec2 slice23 = computeSliceOffset(start + 23., sliceSize);
  vec2 slice24 = computeSliceOffset(start + 24., sliceSize);
  vec2 slice25 = computeSliceOffset(start + 25., sliceSize);
  vec2 slice26 = computeSliceOffset(start + 26., sliceSize);
  vec2 slice27 = computeSliceOffset(start + 27., sliceSize);
  vec2 slice28 = computeSliceOffset(start + 28., sliceSize);
  vec2 slice29 = computeSliceOffset(start + 29., sliceSize);
  vec2 slice30 = computeSliceOffset(start + 30., sliceSize);
  vec2 slice31 = computeSliceOffset(start + 31., sliceSize);
  vec4 sample = texture2DLod(octreeTexture, slice0 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice1 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice2 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice3 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice4 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice5 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice6 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice7 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice8 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice9 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice10 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice11 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice12 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice13 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice14 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice15 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice16 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice17 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice18 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice19 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice20 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice21 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice22 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice23 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice24 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice25 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice26 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice27 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice28 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice29 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice30 + uv, 5.);
  sample += texture2DLod(octreeTexture, slice31 + uv, 5.);
  sample *= .03125;
  return sample;
}


vec3 bruteForce(vec3 pos) {
  vec3 f = vec3(0.);
  for (float y = 0.015625 * .5; y < 1.0; y += 0.015625) {
    for (float x = 0.015625 * .5; x < 1.0; x += 0.015625) {
      vec4 otherPosition = texture2D(positionTexture, vec2(x, y));
      vec3 diff = otherPosition.xyz - pos.xyz;
      float a = dot(diff, diff) + 0.01;
      f += diff / (a * sqrt(a));
    }
  }
  return f;
}

vec3 barnesHut(vec3 pos) {
  vec3 f = vec3(0.);
  for (float y = -1.0 + 0.0625; y < 1.0; y += 0.125) {
    for (float x = -1.0 + 0.0625; x < 1.0; x += 0.125) {
      for (float z = -1.0 + 0.0625; z < 1.0; z += 0.125) {
        vec4 otherPosition = texture3DLod1(vec3(x, y, z));
        vec3 diff = otherPosition.xyz - pos.xyz;
        float a = dot(diff, diff) + 0.01;
        f += otherPosition.a * 8. * diff / (a * sqrt(a));
      }
    }
  }
  return -f;
}

vec3 barnesHut2(vec3 pos) {
  vec3 f = vec3(0.);
  for (float y = -1.0 + 0.125; y < 1.0; y += 0.25) {
    for (float x = -1.0 + 0.125; x < 1.0; x += 0.25) {
      for (float z = -1.0 + 0.125; z < 1.0; z += 0.25) {
        vec4 otherPosition = texture3DLod2(vec3(x, y, z));
        vec3 diff = otherPosition.xyz - pos.xyz;
        float a = dot(diff, diff) + 0.01;
        f += otherPosition.a * 16. * diff / (a * sqrt(a));
      }
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

  // vec3 f = bruteForce(pos);
  // vec3 f = barnesHut(pos);
  vec3 f = barnesHut2(pos);
  vec3 npos = 2. * pos - pre + f * 0.00000001;

  vPos = clamp(npos, vec3(-1.), vec3(1.));

  // vPos = pos;

  gl_Position = vec4(coords * 2. - 1., 0.0, 1.0);
}
