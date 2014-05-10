
precision highp float;

uniform sampler2D positionTexture;
uniform float size;
uniform float slicesPerRow;
uniform float numRows;

attribute vec2 coords;

varying vec3 vPosition;

vec2 computeSliceOffset(float slice, vec2 sliceSize) {
  return sliceSize * vec2(mod(slice, slicesPerRow),
                          floor(slice / slicesPerRow));
}

vec2 getCellCoords(vec3 texCoord) {
  texCoord = (texCoord + 1.) * .5;
  float slice   = texCoord.z * size;
  float sliceZ  = floor(slice);                         // slice we need

  vec2 sliceSize = vec2(1.0 / slicesPerRow,             // u space of 1 slice
                      1.0 / numRows);                 // v space of 1 slice

  vec2 slice0Offset = computeSliceOffset(sliceZ, sliceSize);

  vec2 slicePixelSize = sliceSize / size;               // space of 1 pixel
  vec2 sliceInnerSize = slicePixelSize * (size - 1.0);  // space of size pixels

  vec2 uv = slicePixelSize * 0.5 + texCoord.xy * sliceInnerSize;
  return slice0Offset + uv;
}

void main() {
  vec3 position = texture2D(positionTexture, coords).xyz;
  vec2 cellCoords = getCellCoords(position);

  vPosition = position;

  gl_Position = vec4(cellCoords * 2. - 1., 0., 1.);
}
