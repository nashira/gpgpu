var TerrainGenerator;

(function () {

  var vertexShader = [
    'precision highp float;',
    'attribute vec2 position;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vCoords = position;',
    '  gl_Position = vec4(position * 2. - 1., 0.0, 1.0);',
    '}'
    ].join('\n');
  
  var fragmentShader = [
    'precision highp float;',
    'const float base_freq = 2.;',
    'const float base_amp = .01;',
    // 'const float base_amp = .00625;',
    // 'const float base_amp = .003125;',
    // 'const float base_amp = .00003125;',

    'uniform float time;',
    
    'varying vec2 vCoords;',

    ShaderLib.noise3d,
    
    'float rmnoise(vec2 pos, float freq, float amp) {',
    '  float val = 1. - abs(snoise(vec3(pos, time) * freq));',
    '  return val * val  * amp;',
    '}',
    
    'float noise(vec2 pos, float freq, float amp) {',
    '  return snoise(vec3(pos, time) * freq) * amp;',
    '}',
    
    'float fnoise(vec2 pos) {',
    '  float val = ',
    '      noise(pos, base_freq, base_amp * 6.);',
    // '    + noise(pos, base_freq * 8., base_amp * .1);',
    // '    + rmnoise(pos, base_freq * 2., base_amp * 4.);',
    // '    + rmnoise(pos, base_freq * 4., base_amp * 2.);',
    // '    + rmnoise(pos, 40., .0125);',
    // '    + rmnoise(pos, base_freq * 8., base_amp);',
    // '  float val = noise(pos, .4, 4.);',
    // '  return clamp(val, 0., 10.);',
    '  return val;',
    '}',

    'vec3 gradient(vec2 pos, float d) {',
    '  vec3 c1 = vec3(pos.x - d, fnoise(pos + vec2(-d, 0.)), pos.y) - vec3(pos.x + d, fnoise(pos + vec2(d, 0.)), pos.y);',
    '  vec3 c2 = vec3(pos.x, fnoise(pos + vec2(0., -d)), pos.y -d) - vec3(pos.x, fnoise(pos + vec2(0., d)), pos.y + d);',
    // '  grad.x = fnoise(pos + vec2(-d, 0.)) - fnoise(pos + vec2(d, 0.));',
    // '  grad.z = fnoise(pos + vec2(0., -d)) - fnoise(pos + vec2(0., d));',
    // '  grad.y =  grad.z * grad.x + d;',
    '  return cross(c2, c1);',
    '}',
    
    'void main() {',
    '  float height = fnoise(vCoords);',
    // '  vec2 radius = vCoords - vec2(.5);',
    // '  float height = max(0., sqrt(.04 - radius.x * radius.x - radius.y * radius.y));',
    // '  vec3 normal = gradient(vCoords, .002);',
    // '  gl_FragColor = vec4(normalize(normal), height);',
    '  gl_FragColor = vec4(height, 0., 0., 0.);',
    '}'
    ].join('\n');
  
  var addWaterFS = [
    'precision highp float;',
    'uniform sampler2D erosion;',
    'const float waterDelta = .0005;',
    'const float cDelta = 1. / #{size}.;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vec4 data = texture2D(erosion, vCoords);',
    '  data.y += waterDelta;',
    '  gl_FragColor = data;',
    '}'
  ].join('\n');
  
  var fluxFS = [
    'precision highp float;',
    'uniform sampler2D erosion;',
    'uniform sampler2D oldFlux;',
    'const float cDelta = 1. / #{size}.;',
    'const float timeDelta = #{timeDelta};',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vec4 oldFlux = texture2D(oldFlux, vCoords);',
    '  vec4 center = texture2D(erosion, vCoords);',
    
    // '  vec4 left = texture2D(erosion, vCoords + vec2(-cDelta, cDelta));',
    // '  vec4 right = texture2D(erosion, vCoords + vec2(cDelta, cDelta));',
    // '  vec4 top = texture2D(erosion, vCoords + vec2(cDelta, -cDelta));',
    // '  vec4 bottom = texture2D(erosion, vCoords + vec2(-cDelta, -cDelta));',
    
    '  vec4 left = texture2D(erosion, vCoords - vec2(cDelta, 0.));',
    '  vec4 right = texture2D(erosion, vCoords + vec2(cDelta, 0.));',
    '  vec4 top = texture2D(erosion, vCoords + vec2(0., cDelta));',
    '  vec4 bottom = texture2D(erosion, vCoords - vec2(0., cDelta));',
    
    '  float fluxLeft = max(0., oldFlux.x + timeDelta * (center.x + center.y - left.x - left.y));',
    '  float fluxRight = max(0., oldFlux.y + timeDelta * (center.x + center.y - right.x - right.y));',
    '  float fluxTop = max(0., oldFlux.z + timeDelta * (center.x + center.y - top.x - top.y));',
    '  float fluxBottom = max(0., oldFlux.w + timeDelta * (center.x + center.y - bottom.x - bottom.y));',
    
    '  vec4 newFlux = vec4(fluxLeft, fluxRight, fluxTop, fluxBottom);',
    '  float total = newFlux.x + newFlux.y + newFlux.z + newFlux.w;',
    '  float scale = min(1., center.y / (total));',
    // '  float scale = 1.;',
    
    '  gl_FragColor = newFlux * scale;',
    '}'
  ].join('\n');

  
  var updateWaterFS = [
    'precision highp float;',
    'uniform sampler2D erosion;',
    'uniform sampler2D flux;',
    'const float timeDelta = #{timeDelta};',
    'const float cDelta = 1. / #{size}.;',
    'varying vec2 vCoords;',


    'vec3 normal1(vec2 coord) {',
    '  float h1 = texture2D(erosion, coord + vec2(-cDelta, 0.)).x;',
    '  float h2 = texture2D(erosion, coord + vec2(cDelta, 0)).x;',
    '  float h3 = texture2D(erosion, coord + vec2(0., cDelta)).x;',
    '  float h4 = texture2D(erosion, coord + vec2(0., -cDelta)).x;',
    
    '  vec3 c1 = vec3(coord.x - cDelta, h1, coord.y) - vec3(coord.x + cDelta, h2, coord.y);',
    '  vec3 c2 = vec3(coord.x, h3, coord.y + cDelta) - vec3(coord.x, h4, coord.y - cDelta);',
    
    '  return normalize(cross(c1, c2));',
    '}',
    
    'void main() {',
    '  vec4 data = texture2D(erosion, vCoords);',
    // '  vec4 dl = texture2D(erosion, vCoords - vec2(cDelta, 0.));',
    // '  vec4 dr = texture2D(erosion, vCoords + vec2(cDelta, 0.));',
    // '  vec4 dt = texture2D(erosion, vCoords + vec2(0., cDelta));',
    // '  vec4 db = texture2D(erosion, vCoords - vec2(0., cDelta));',
    
    '  vec4 center = texture2D(flux, vCoords);',
    '  vec4 left = texture2D(flux, vCoords - vec2(cDelta, 0.));',
    '  vec4 right = texture2D(flux, vCoords + vec2(cDelta, 0.));',
    '  vec4 top = texture2D(flux, vCoords + vec2(0., cDelta));',
    '  vec4 bottom = texture2D(flux, vCoords - vec2(0., cDelta));',
    
    // '  vec4 left = texture2D(flux, vCoords + vec2(-cDelta, cDelta));',
    // '  vec4 right = texture2D(flux, vCoords + vec2(cDelta, cDelta));',
    // '  vec4 top = texture2D(flux, vCoords + vec2(cDelta, -cDelta));',
    // '  vec4 bottom = texture2D(flux, vCoords + vec2(-cDelta, -cDelta));',
    
    // '  vec3 c1 = vec3(vCoords.x - cDelta, dl.x, vCoords.y) - vec3(vCoords.x + cDelta, dr.x, vCoords.y);',
    // '  vec3 c2 = vec3(vCoords.x, dt.x, vCoords.y + cDelta) - vec3(vCoords.x, db.x, vCoords.y - cDelta);',
    // '  vec3 normal = normalize(cross(c1, c2));',
    
    '  float heightDelta = (left.y + right.x + top.w + bottom.z - center.x - center.y - center.z - center.w);',
    '  data.y += heightDelta;',
    // '  data.y += (left.w + right.z + top.x + bottom.y - center.x - center.y - center.z - center.w);',
    '  vec3 velocity = .5 * vec3(left.y - center.x + center.y - right.x, 0., bottom.z - center.w + center.z - top.w);',
    '  float capacity = length(velocity) * (1. - smoothstep(0., 1., data.y * 40.));// * (1. - dot(normal, vec3(0., 1., 0.)));',
    '  float terrainChange = timeDelta * (data.z - capacity);',
    '  data.x += terrainChange;',
    '  data.z -= terrainChange;',
    '  data.y -= terrainChange;',
    '',
    // '  data.z += heightDelta * timeDelta;',
    // '  data.z = texture2D(erosion, vCoords - velocity.xz * timeDelta).z - terrainChange;',
    // '  data.y *= 0.9;',
    '',
    '  gl_FragColor = data;',
    '}'
  ].join('\n');

  
  var sedimentFS = [
    'precision highp float;',
    'uniform sampler2D erosion;',
    'uniform sampler2D flux;',
    'const float timeDelta = #{timeDelta};',
    'const float cDelta = 1. / #{size}.;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vec4 data = texture2D(erosion, vCoords);',
    '  vec4 center = texture2D(flux, vCoords);',
    '  vec4 left = texture2D(flux, vCoords - vec2(cDelta, 0.));',
    '  vec4 right = texture2D(flux, vCoords + vec2(cDelta, 0.));',
    '  vec4 top = texture2D(flux, vCoords + vec2(0., cDelta));',
    '  vec4 bottom = texture2D(flux, vCoords - vec2(0., cDelta));',
    
    '  vec2 velocity = .5 * vec2(left.y - center.x + center.y - right.x, bottom.z - center.w + center.z - top.w);',
    '  data.z = texture2D(erosion, vCoords - sign(velocity) * cDelta).z;',
    '  data.y *= 0.9;',
    '  gl_FragColor = data;',
    '}'
  ].join('\n');
  
  var position;
  var timeDelta = 0.02;
  
  TerrainGenerator = function (width, height) {
    this.genProgram = new Program(vertexShader, fragmentShader, {
      drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
    this.genProgram.addAttribute('position', 2, gl.FLOAT, position);

    this.erosionTarget = new RenderTarget(width, height, {type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT});
    this.fluxTarget = new RenderTarget(width, height, {type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT});
    this.tmpRenderTarget = new RenderTarget(width, height, {type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT});
    
    addWaterFS = addWaterFS.replace(/#\{size\}/g, width);
    this.addWaterProgram = new Program(vertexShader, addWaterFS, {
      drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
    this.addWaterProgram.addAttribute('position', 2, gl.FLOAT, position);
    this.addWaterProgram.addUniform('erosion', 't');
    
    fluxFS = fluxFS.replace(/#\{size\}/g, width);
    fluxFS = fluxFS.replace(/#\{timeDelta\}/g, timeDelta);
    this.fluxProgram = new Program(vertexShader, fluxFS, {
      drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
    this.fluxProgram.addAttribute('position', 2, gl.FLOAT, position);
    this.fluxProgram.addUniform('erosion', 't');
    this.fluxProgram.addUniform('oldFlux', 't');

    updateWaterFS = updateWaterFS.replace(/#\{size\}/g, width);
    updateWaterFS = updateWaterFS.replace(/#\{timeDelta\}/g, timeDelta);
    this.updateWaterProgram = new Program(vertexShader, updateWaterFS, {
      drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
    this.updateWaterProgram.addAttribute('position', 2, gl.FLOAT, position);
    this.updateWaterProgram.addUniform('erosion', 't');
    this.updateWaterProgram.addUniform('flux', 't');


    sedimentFS = sedimentFS.replace(/#\{size\}/g, width);
    sedimentFS = sedimentFS.replace(/#\{timeDelta\}/g, timeDelta);
    this.sedimentProgram = new Program(vertexShader, sedimentFS, {
      drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
    this.sedimentProgram.addAttribute('position', 2, gl.FLOAT, position);
    this.sedimentProgram.addUniform('erosion', 't');
    this.sedimentProgram.addUniform('flux', 't');
    // this.sedimentTexture = new Texture(width, height);
    // this.sedimentTexture.init();

    // this.genProgram.setRenderTarget(this.erosionTarget, true);
    // this.aeProgram = new ApplyErosion(width, height);
  }
  
  TerrainGenerator.init = function () {
    position = new DataBuffer(2, 4, new Float32Array([0,0, 0,1, 1,0, 1,1]));
  }
  
  TerrainGenerator.prototype = {
    generate: function () {
      this.genProgram.setRenderTarget(this.tmpRenderTarget);
      this.genProgram.draw(0, 4);
      this.swapTargets('tmpRenderTarget', 'erosionTarget');
    },
    
    addWater: function () {
      this.addWaterProgram.setRenderTarget(this.tmpRenderTarget);
      this.addWaterProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.addWaterProgram.draw(0, 4);
      this.swapTargets('tmpRenderTarget', 'erosionTarget');
    },
    
    computeFlux: function () {
      this.fluxProgram.setRenderTarget(this.tmpRenderTarget);
      this.fluxProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.fluxProgram.setUniform('oldFlux', this.fluxTarget.getGlTexture());
      this.fluxProgram.draw(0, 4);
      this.swapTargets('tmpRenderTarget', 'fluxTarget');
    },
    
    updateWater: function () {
      this.updateWaterProgram.setRenderTarget(this.tmpRenderTarget);
      this.updateWaterProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.updateWaterProgram.setUniform('flux', this.fluxTarget.getGlTexture());
      this.updateWaterProgram.draw(0, 4);
      this.swapTargets('tmpRenderTarget', 'erosionTarget');
    },
    
    updateSediment: function () {
      // this.sedimentTexture.glTexture = this.erosionTarget.getGlTexture();
      this.sedimentProgram.setRenderTarget(this.tmpRenderTarget);
      this.sedimentProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.sedimentProgram.setUniform('flux', this.fluxTarget.getGlTexture());
      this.sedimentProgram.draw(0, 4);
      this.swapTargets('tmpRenderTarget', 'erosionTarget');
    },
    
    swapTargets: function (a, b) {
      var t = this[a];
      this[a] = this[b];
      this[b] = t;
    }
  }
  
  // function getEData(w, h) {
  //   var d = new Float32Array(w*h*4);
  //   for (var i = 3; i < w*h*4; i+=4) {
  //     d[i] = 1;
  //   }
  //   return d;
  // }
}());