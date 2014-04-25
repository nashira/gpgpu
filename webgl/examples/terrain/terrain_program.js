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
    'const float base_freq = 8.;',
    // 'const float base_amp = .00625;',
    // 'const float base_amp = .003125;',
    'const float base_amp = .00003125;',

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
    '      noise(pos, base_freq, base_amp * 8.);',
    // '    + noise(pos, 8., .1)',
    // '    + rmnoise(pos, base_freq * 2., base_amp * 4.)',
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
    '  vec3 normal = gradient(vCoords, .002);',
    '  gl_FragColor = vec4(normalize(normal), height);',
    '}'
    ].join('\n');
  
  var erosionVS = [
    'precision highp float;',
    'attribute vec2 position;',
    'varying vec2 vCoords;',
    
    'void main() {',
    '  vCoords = position;',
    '  gl_Position = vec4(position * 2. - 1., 0.0, 1.0);',
    '}'
    ].join('\n');
  
  var erosionFS = [
    'precision highp float;',
    'uniform sampler2D terrain;',
    'uniform sampler2D erosion;',
    'const float cDelta = 1. / 512.;',
    'varying vec2 vCoords;',
    
    'float sinkFactor(vec2 coord) {',
    // '  float sink = 0.;',
    // '  float m = 1.;',
    '  float m = texture2D(erosion, coord + vec2(-cDelta, -cDelta)).a;',
    '  float sink = max(m * dot(texture2D(terrain, coord + vec2(-cDelta, -cDelta)).xyz, vec3(.707107, 0., .707107)), 0.);',
    '  m = texture2D(erosion, coord + vec2(0., -cDelta)).a;',
    '  sink += max(m * dot(texture2D(terrain, coord + vec2(0., -cDelta)).xyz, vec3(0, 0., 1.)), 0.);',
    '  m = texture2D(erosion, coord + vec2(cDelta, -cDelta)).a;',
    '  sink += max(m * dot(texture2D(terrain, coord + vec2(cDelta, -cDelta)).xyz, vec3(-.707107, 0., .707107)), 0.);',
    '  m = texture2D(erosion, coord + vec2(-cDelta, 0.)).a;',
    '  sink += max(m * dot(texture2D(terrain, coord + vec2(-cDelta, 0.)).xyz, vec3(1., 0., 0.)), 0.);',
    '  m = texture2D(erosion, coord + vec2(cDelta, 0.)).a;',
    '  sink += max(m * dot(texture2D(terrain, coord + vec2(cDelta, 0.)).xyz, vec3(-1., 0., 0.)), 0.);',
    '  m = texture2D(erosion, coord + vec2(-cDelta, cDelta)).a;',
    '  sink += max(m * dot(texture2D(terrain, coord + vec2(-cDelta, cDelta)).xyz, vec3(.707107, 0., -.707107)), 0.);',
    '  m = texture2D(erosion, coord + vec2(0., cDelta)).a;',
    '  sink += max(m * dot(texture2D(terrain, coord + vec2(0., cDelta)).xyz, vec3(0, 0., -1.)), 0.);',
    '  m = texture2D(erosion, coord + vec2(cDelta, cDelta)).a;',
    '  sink += max(m * dot(texture2D(terrain, coord + vec2(cDelta, cDelta)).xyz, vec3(-.707107, 0., -.707107)), 0.);',
    // '  return clamp(sink * .01, .0, .5);',
    '  return sink * .1;',
    '}',
    
    'void main() {',
    '  float sink = sinkFactor(vCoords);',
    // '  vec4 data = texture2D(erosion, vCoords);',
    // '  gl_FragColor = vec4(vec3(data.a), 1.);',
    // '  gl_FragColor = vec4(vec3(0.), sink);',
    '  gl_FragColor = vec4(vec3(sink) * 100., 1.);',
    // '  gl_FragColor = vec4(data.xyz, 1.);',
    '}'
  ].join('\n');
  

  
  var applyErosionFS = [
    'precision highp float;',
    'uniform sampler2D terrain;',
    'uniform sampler2D erosion;',
    'const float cDelta = 1. / 512.;',
    'varying vec2 vCoords;',

    'vec3 gradient(vec2 coord) {',
    '  float h1 = texture2D(terrain, coord + vec2(-cDelta, 0.)).a;',
    '  float h2 = texture2D(terrain, coord + vec2(cDelta, 0)).a;',
    '  float h3 = texture2D(terrain, coord + vec2(0., -cDelta)).a;',
    '  float h4 = texture2D(terrain, coord + vec2(0., cDelta)).a;',
    
    '  vec3 c1 = vec3(coord.x - cDelta, h1, coord.y) - vec3(coord.x + cDelta, h2, coord.y);',
    '  vec3 c2 = vec3(coord.x, h3, coord.y - cDelta) - vec3(coord.x, h4, coord.y + cDelta);',
    
    '  return cross(c2, c1);',
    '}',
    
    'void main() {',
    '  vec4 ero = texture2D(erosion, vCoords);',
    '  vec4 ter = texture2D(terrain, vCoords);',

    '  vec3 normal = gradient(vCoords);',
    
    '  gl_FragColor = vec4(normalize(normal), ter.a - ero.a * 0.1);',
    // '  gl_FragColor = vec4(ter.xyz, ter.a - ero.a * 0.01);',
    // '  gl_FragColor = vec4(ter.xyz, 0.2);',
    // '  gl_FragColor = ter;',
    '}'
  ].join('\n');
    

  
  var position, tmpRenderTarget;
  
  var ApplyErosion = function (width, height) {
    Program.call(this, vertexShader, applyErosionFS, {drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
    this.addAttribute('position', 2, gl.FLOAT, position);
    this.addUniform('terrain', 't');
    this.addUniform('erosion', 't');
  }
  
  ApplyErosion.prototype = Object.create(Program.prototype);
  
  var ErosionProgram = function (width, height) {
    Program.call(this, erosionVS, erosionFS, {drawMode: gl.TRIANGLE_STRIP, viewport: {x:0,y:0,w:width,h:height}});
    this.addAttribute('position', 2, gl.FLOAT, position);

    this.renderTarget = new RenderTarget(width, height, {type: gl.FLOAT, data: getEData(width, height)});
    this.addUniform('terrain', 't');
    this.addUniform('erosion', 't');
  }
  
  ErosionProgram.prototype = Object.create(Program.prototype);
  
  ErosionProgram.prototype.step = function () {
    this.setUniform('erosion', this.renderTarget.getGlTexture());
    this.setRenderTarget(tmpRenderTarget);
    this.erosionTexture = tmpRenderTarget.getGlTexture();
    var t = this.renderTarget;
    this.renderTarget = tmpRenderTarget;
    tmpRenderTarget = t;
    this.draw(0, 4);
  }
  
  TerrainGenerator = function (width, height) {
    tmpRenderTarget = new RenderTarget(width, height, {type: gl.FLOAT});
    this.program = new Program(vertexShader, fragmentShader, {drawMode: gl.TRIANGLE_STRIP});
    this.program.addAttribute('position', 2, gl.FLOAT, position);

    this.renderTarget = new RenderTarget(width, height, {type: gl.FLOAT});
    this.program.setRenderTarget(this.renderTarget, true);
    
    this.erosionProgram = new ErosionProgram(width, height);
    this.erosionProgram.setUniform('terrain', this.renderTarget.getGlTexture());
    this.aeProgram = new ApplyErosion(width, height);
  }
  
  TerrainGenerator.init = function () {
    position = new DataBuffer(2, 4, new Float32Array([0,0, 0,1, 1,0, 1,1]));
  }
  
  TerrainGenerator.prototype = {
    generate: function () {
      this.program.draw(0, 4);
    },
    
    applyErosion: function () {
      this.aeProgram.setUniform('terrain', this.renderTarget.getGlTexture());
      this.aeProgram.setUniform('erosion', this.erosionProgram.erosionTexture);
      this.aeProgram.setRenderTarget(tmpRenderTarget);

      var t = this.renderTarget;
      this.renderTarget = tmpRenderTarget;
      tmpRenderTarget = t;
      
      this.erosionProgram.setUniform('terrain', this.renderTarget.getGlTexture());
      
      this.aeProgram.draw(0, 4);
    }
  }
  
  function getEData(w, h) {
    var d = new Float32Array(w*h*4);
    for (var i = 3; i < w*h*4; i+=4) {
      d[i] = 1;
    }
    return d;
  }
}());