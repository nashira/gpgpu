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
    'const float base_amp = .003125;',

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
    '      noise(pos, base_freq, base_amp * 12.)',
    // '    + noise(pos, 8., .1)',
    '    + rmnoise(pos, base_freq * 2.5, base_amp * 4.)',
    '    + rmnoise(pos, base_freq * 5., base_amp * 2.);',
    // '    + rmnoise(pos, 40., .0125);',
    '    + rmnoise(pos, base_freq * 10., base_amp);',
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
    '  vec3 normal = gradient(vCoords, .001);',
    '  gl_FragColor = vec4(normalize(normal), height);',
    '}'
    ].join('\n');
    
  TerrainGenerator = function (width, height) {
    this.program = new Program(vertexShader, fragmentShader);
    var position = new DataBuffer(2, 4, new Float32Array([0,1,0,0,1,0,1,1]));
    this.program.addAttribute('position', 2, gl.FLOAT, position);
    var indecies = new IndexBuffer(2, 6, new Uint16Array([0,1,2,0,2,3]));
    this.program.setIndexBuffer(indecies);

    this.renderTarget = new RenderTarget(width, height, {type: gl.FLOAT});
    this.program.setRenderTarget(this.renderTarget, true)
  }
  
  TerrainGenerator.prototype = {
    generate: function () {
      this.program.draw(0, 6);
    }
  }
}());