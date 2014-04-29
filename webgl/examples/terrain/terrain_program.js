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
    'const float base_freq = 1.;',
    'const float base_amp = .02;',
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
    '      noise(pos, base_freq, base_amp * 6.)',
    '    + noise(pos, base_freq * 8., base_amp * .1);',
    // '    + rmnoise(pos, base_freq * 2., base_amp * 4.);',
    // '    + rmnoise(pos, base_freq * 4., base_amp * 2.);',
    // '    + rmnoise(pos, 40., .0125);',
    // '    + rmnoise(pos, base_freq * 8., base_amp);',
    // '  float val = noise(pos, .4, 4.);',
    // '  return clamp(val, 0., 10.);',
    '  return val;',
    '}',
    
    'void main() {',
    '  float height = fnoise(vCoords + -5.);',
    // '  float height = max(0., (vCoords.x - vCoords.y - .5) * 0.5);',
    // '  float height = max(0., .1 - max(abs(vCoords.x - .5), abs(vCoords.y - .5)));',
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
    'const float waterDelta = .001;',
    'const float cDelta = 1. / #{size}.;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vec4 data = texture2D(erosion, vCoords);',
    '  data.y += waterDelta;',
    '  gl_FragColor = data;',
    '}'
  ].join('\n');
  

  
  var fluxLookup = [
  '  vec4 left, right, top, bottom;',
  // '  if (corners) {',
  // '    left = texture2D(flux, vCoords + vec2(-cDelta, cDelta));',
  // '    right = texture2D(flux, vCoords + vec2(cDelta, -cDelta));',
  // '    top = texture2D(flux, vCoords + vec2(cDelta, cDelta));',
  // '    bottom = texture2D(flux, vCoords + vec2(-cDelta, -cDelta));',
  // '  } else {',
  '    left = texture2D(flux, vCoords + vec2(-cDelta, 0.));',
  '    right = texture2D(flux, vCoords + vec2(cDelta, 0.));',
  '    top = texture2D(flux, vCoords + vec2(0., cDelta));',
  '    bottom = texture2D(flux, vCoords + vec2(0., -cDelta));',
  // '  }',
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
    // '  vec4 right = texture2D(erosion, vCoords + vec2(cDelta, -cDelta));',
    // '  vec4 top = texture2D(erosion, vCoords + vec2(cDelta, cDelta));',
    // '  vec4 bottom = texture2D(erosion, vCoords + vec2(-cDelta, -cDelta));',

    // '  vec4 left = right = top = bottom = vec4(center.x, center.y, 0., 0.);',
    
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

  
  var waterLevelFS = [
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
    '  vec4 center = texture2D(flux, vCoords);',
    fluxLookup,
    '  data.y += (left.y + right.x + top.w + bottom.z - center.x - center.y - center.z - center.w);',
    '  gl_FragColor = data;',
    '}'
  ].join('\n');
  
  var velocityFS = [
    'precision highp float;',
    'uniform sampler2D flux;',
    'const float timeDelta = #{timeDelta};',
    'const float cDelta = 1. / #{size}.;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vec4 center = texture2D(flux, vCoords);',
    fluxLookup,
    '  vec3 velocity = .5 * vec3(left.y - center.x + center.y - right.x, 0., bottom.z - center.w + center.z - top.w);',
    '  gl_FragColor = vec4(velocity, 1.);',
    '}'
  ].join('\n');
  
  var erosionDepFS = [
    'precision highp float;',
    'uniform sampler2D erosion;',
    'uniform sampler2D velocity;',
    'const float timeDelta = #{timeDelta};',
    'const float cDelta = 1. / #{size}.;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vec4 data = texture2D(erosion, vCoords);',
    '  vec4 velo = texture2D(velocity, vCoords);',
    '  float capacity = .001 + length(velo.xyz) * (1. - smoothstep(0., 1., data.y * 100.));// * (1. - dot(normal, vec3(0., 1., 0.)));',
    '  float sedimentFactor = 1.;',
    '  if (data.z > capacity) sedimentFactor = 3.;',
    // 
    '  float terrainChange = timeDelta * sedimentFactor * (data.z - capacity);',
    '  data.x += terrainChange;',
    '  data.z -= terrainChange;',
    '  data.y -= terrainChange;',
    '  gl_FragColor = data;',
    '}'
  ].join('\n');
  
  
  var sedimentFS = [
    'precision highp float;',
    'uniform sampler2D erosion;',
    'uniform sampler2D velocity;',
    // 'uniform float Ke;',
    // 'uniform float Kr;',
    'const float timeDelta = #{timeDelta};',
    'const float cDelta = 1. / #{size}.;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vec4 data = texture2D(erosion, vCoords);',
    
    '  vec2 velo = texture2D(velocity, vCoords).xz;',
    '  data.z = texture2D(erosion, vCoords - velo * timeDelta).z;',
    '  data.y = data.y * 0.999 + .00001;',
    '  gl_FragColor = data;',
    '}'
  ].join('\n');
  
  var timeDelta = 0.05;
  
  TerrainGenerator = function (width, height) {
    var position = new DataBuffer(2, 4, new Float32Array([0,0, 0,1, 1,0, 1,1]));
    // 
    this.erosionTarget = new RenderTarget(width, height, {type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT});
    this.fluxTarget = new RenderTarget(width, height, {type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT});
    this.velocityTarget = new RenderTarget(width, height, {type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT});
    this.tmpRenderTarget = new RenderTarget(width, height, {type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT});
    
    // this.erosionTarget = new RenderTarget(width, height, {type: gl.FLOAT});
    // this.fluxTarget = new RenderTarget(width, height, {type: gl.FLOAT});
    // this.tmpRenderTarget = new RenderTarget(width, height, {type: gl.FLOAT});
    
    function newProgram(fs) {
      fs = fs.replace(/#\{size\}/g, width);
      fs = fs.replace(/#\{timeDelta\}/g, timeDelta);
      var p = new Program(vertexShader, fs, {
        drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
      p.addAttribute('position', 2, gl.FLOAT, position);
      return p;
    }

    this.genProgram = newProgram(fragmentShader);
    
    this.addWaterProgram = newProgram(addWaterFS);
    this.addWaterProgram.addUniform('erosion', 't');
    
    this.fluxProgram = newProgram(fluxFS);
    this.fluxProgram.addUniform('erosion', 't');
    this.fluxProgram.addUniform('oldFlux', 't');
    this.clampTexture = new Texture(width, height, {
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });

    this.waterLevelProgram = newProgram(waterLevelFS);
    this.waterLevelProgram.addUniform('erosion', 't');
    this.waterLevelProgram.addUniform('flux', 't');

    this.velocityProgram = newProgram(velocityFS);
    this.velocityProgram.addUniform('flux', 't');

    this.erosionProgram = newProgram(erosionDepFS);
    this.erosionProgram.addUniform('erosion', 't');
    this.erosionProgram.addUniform('velocity', 't');

    this.sedimentProgram = newProgram(sedimentFS);
    this.sedimentProgram.addUniform('erosion', 't');
    this.sedimentProgram.addUniform('velocity', 't');

    this.linearTexture = new Texture(width, height, {
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });
  }
  
  TerrainGenerator.init = function () {
    
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
      this.clampTexture.glTexture = this.fluxTarget.getGlTexture();
      this.clampTexture.applyParameters();
      this.clampTexture.glTexture = this.erosionTarget.getGlTexture();
      this.clampTexture.applyParameters();
      this.fluxProgram.setRenderTarget(this.tmpRenderTarget);
      this.fluxProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.fluxProgram.setUniform('oldFlux', this.fluxTarget.getGlTexture());
      this.fluxProgram.draw(0, 4);
      this.fluxTarget.texture.applyParameters();
      this.erosionTarget.texture.applyParameters();
      this.swapTargets('tmpRenderTarget', 'fluxTarget');
    },
    
    waterLevel: function () {
      this.waterLevelProgram.setRenderTarget(this.tmpRenderTarget);
      this.waterLevelProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.waterLevelProgram.setUniform('flux', this.fluxTarget.getGlTexture());
      this.waterLevelProgram.draw(0, 4);
      this.swapTargets('tmpRenderTarget', 'erosionTarget');
    },
    
    waterVelocity: function () {
      this.clampTexture.glTexture = this.fluxTarget.getGlTexture();
      this.clampTexture.applyParameters();
      
      this.velocityProgram.setRenderTarget(this.tmpRenderTarget);
      this.velocityProgram.setUniform('flux', this.fluxTarget.getGlTexture());
      this.velocityProgram.draw(0, 4);
      
      this.fluxTarget.texture.applyParameters();
      this.swapTargets('tmpRenderTarget', 'velocityTarget');
    },
    
    erosionDeposition: function () {
      this.erosionProgram.setRenderTarget(this.tmpRenderTarget);
      this.erosionProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.erosionProgram.setUniform('velocity', this.velocityTarget.getGlTexture());
      this.erosionProgram.draw(0, 4);
      
      this.swapTargets('tmpRenderTarget', 'erosionTarget');
    },
    
    sedimentTransport: function () {
      this.linearTexture.glTexture = this.erosionTarget.getGlTexture();
      this.linearTexture.applyParameters();
      this.sedimentProgram.setRenderTarget(this.tmpRenderTarget);
      this.sedimentProgram.setUniform('erosion', this.erosionTarget.getGlTexture());
      this.sedimentProgram.setUniform('velocity', this.velocityTarget.getGlTexture());
      this.sedimentProgram.draw(0, 4);
      this.erosionTarget.texture.applyParameters();
      this.swapTargets('tmpRenderTarget', 'erosionTarget');
    },
    
    swapTargets: function (a, b) {
      var t = this[a];
      this[a] = this[b];
      this[b] = t;
    },
    
    step: function () {
      // this.addWater();
      this.computeFlux();
      this.waterLevel();
      this.waterVelocity();
      this.erosionDeposition();
      // this.updateSediment();
      this.sedimentTransport();
      // this.evaporation();
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