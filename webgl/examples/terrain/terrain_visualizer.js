var TerrainVisualizer;

(function () {
  var vertexShader = [
    'precision highp float;',
    'uniform mat4 mvMatrix;',
    'uniform mat4 pMatrix;',
    'uniform sampler2D erosion;',
    'attribute vec2 coords;',
    'const float cDelta = 1. / #{size}.;',

    'varying vec3 vNormal;',
    'varying vec3 vWorldPos;',
    'varying vec4 vData;',

    'vec3 getNormal(vec2 coord) {',
    '  float h1 = texture2D(erosion, coord + vec2(-cDelta, 0.)).x;',
    '  float h2 = texture2D(erosion, coord + vec2(cDelta, 0)).x;',
    '  float h3 = texture2D(erosion, coord + vec2(0., cDelta)).x;',
    '  float h4 = texture2D(erosion, coord + vec2(0., -cDelta)).x;',
  
    '  vec3 c1 = vec3(coord.x - cDelta, h1, coord.y) - vec3(coord.x + cDelta, h2, coord.y);',
    '  vec3 c2 = vec3(coord.x, h3, coord.y + cDelta) - vec3(coord.x, h4, coord.y - cDelta);',
  
    '  return normalize(cross(c1, c2));',
    '}',
    
    'void main() {',
    '  vec4 vertex = texture2D(erosion, coords);',
    '  vNormal = getNormal(coords);',
    '  vec3 pos = vec3(coords.x - .5, vertex.x, coords.y - .5);',
    '  vec4 wPos = mvMatrix * vec4(pos, 1.);',
    '  vWorldPos = wPos.xyz;',
    '  vData = vertex;',
    '  gl_Position = pMatrix * wPos;',
    '}'
    ].join('\n');
  
  
  var fragmentShader = [
    'precision highp float;',
    'uniform float lightness;',
    'uniform float colorScale;',
    
    'uniform mat4 mvMatrix;',
    
    'varying vec3 vWorldPos;',
    'varying vec3 vNormal;',
    'varying vec4 vData;',

    // 'const vec3 light_direction = vec3(0.24, -0.97, 0.);',
    'const vec3 light_direction = vec3(0.0, -1., 0.);',
    // 'const vec3 light_direction = vec3(0., -0.894427, 0.447214);',
    // 'const vec4 light_diffuse = vec4(0.8, 0.8, 0.8, 0.0);',
    'const vec4 light_diffuse = vec4(1., 1., 1., 1.0);',
    'const vec4 light_ambient = vec4(0.2, 0.2, 0.3, 1.0);',
    'const vec4 light_specular = vec4(1.0, 1.0, 1.0, 1.0);',
    
    'const vec3 sand = vec3(.75, .66, .47);',
    // 'const vec3 grass = vec3(.34, .37, .15);',
    'const vec3 grass = vec3(.22, .32, .05);',
    'const vec3 rock = vec3(.37, .30, .25);',
    'const vec3 snow = vec3(.95, .95, .99);',
    
    'void main() {',
    '  float height = max(0., vData.x) * colorScale;',
    '  vec4 weights;',
    '  weights.x = clamp(1. - abs(height - 0.0) * 5., 0., 1.);',
    '  weights.y = clamp(1. - abs(height - 0.3) * 4., 0., 1.);',
    '  weights.z = clamp(1. - abs(height - 0.6) * 4., 0., 1.);',
    '  weights.w = clamp(1. - abs(height - 0.9) * 4., 0., 1.);',
    '  weights /= (weights.x + weights.y + weights.z + weights.w - lightness);',
    '  vec3 color = sand * weights.x + grass * weights.y + rock * weights.z + snow * weights.w;',
    
    'vec3 mv_light_direction = normalize((mvMatrix * vec4(light_direction, 0.0)).xyz);',
    'vec3 eye = normalize(vWorldPos);',
    'vec3 reflection = reflect(mv_light_direction, vNormal);',
    // // 'vec4 frag_diffuse = vec4(.1);',
    // 
    // '  vec3 color = mix(vec3(.86,.57,.34), vec3(1.), vData.x * 10. + .2);',

    // '  if (vData.y > .001) {',
    // '    color = mix(color, vec3(0., .25, .55), vData.y * 40.);',
    // '  }',

    'vec4 frag_diffuse = vec4(color, 1.);',
    'vec4 diffuse_factor = max(-dot(vNormal, mv_light_direction), 0.0) * light_diffuse;',
    'vec4 ambient_diffuse_factor = diffuse_factor + light_ambient;',
    // 'vec4 specular_factor = max(pow(-dot(reflection, eye), vNormal.y * vNormal.y), 0.0) * light_specular;',
    // 'gl_FragColor = specular_factor * vec4(.1) + ambient_diffuse_factor * frag_diffuse;',
    
    'gl_FragColor = ambient_diffuse_factor * frag_diffuse;',
    // 'gl_FragColor = frag_diffuse;',
    
    '}'
    ].join('\n');

  var waterVertexShader = [
    'precision highp float;',
    'uniform mat4 mvMatrix;',
    'uniform mat4 pMatrix;',
    'uniform sampler2D erosion;',
    'uniform float waterVisDepth;',
    'attribute vec2 coords;',
    'const float cDelta = 1. / #{size}.;',
    
    'varying vec4 vData;',
  
    'void main() {',
    '  vec4 vertex = texture2D(erosion, coords);',
    // '  vNormal = getNormal(coords);',
    '  vec3 pos = vec3(coords.x - .5, vertex.x + vertex.y - waterVisDepth, coords.y - .5);',
    '  vec4 wPos = mvMatrix * vec4(pos, 1.);',
    '  vData = vertex;',
    '  gl_Position = pMatrix * wPos;',
    '}'
    ].join('\n');

  var waterFragmentShader = [
    'precision highp float;',
    'uniform float lightness;',
    'uniform float colorScale;',
    'uniform float waterVisDepth;',
    'uniform vec4 waterColor;',

    'varying vec4 vData;',

    'void main() {',
    '  gl_FragColor = waterColor;',
    '}'
    ].join('\n');
    
  TerrainVisualizer = function (width, height, viewWidth, viewHeight) {

    vertexShader = vertexShader.replace(/#\{size\}/g, width);
    waterVertexShader = waterVertexShader.replace(/#\{size\}/g, width);
    this.program = new Program(vertexShader, fragmentShader, {
      drawMode: gl.TRIANGLE_STRIP,
      // drawMode: gl.LINE_STRIP,
      cullFace: gl.BACK,
      // blendEnabled: true,
      // blendEquation: gl.MAX,
      blendFunc: [gl.SRC_ALPHA, gl.GL_ONE_MINUS_SRC_ALPHA]
    });
    
    this.waterProgram = new Program(waterVertexShader, waterFragmentShader, {
      drawMode: gl.TRIANGLE_STRIP,
      // drawMode: gl.LINE_STRIP,
      cullFace: gl.BACK,
      blendEnabled: true,
      // depthTest: true,
      // blendEquation: gl.MAX,
      blendFunc: [gl.ONE_MINUS_SRC_ALPHA, gl.ONE]
    });
    
    var pm = Matrix.makePerspective(.8, viewWidth / viewHeight, .1, 1000);
  
    this.program.addUniform('erosion', 't');
    this.program.addUniform('lightness', 'f');
    this.program.addUniform('colorScale', 'f');
    this.program.addUniform('pMatrix', 'm4', pm);
    this.program.addUniform('mvMatrix', 'm4');
  
    this.waterProgram.addUniform('erosion', 't');
    this.waterProgram.addUniform('waterVisDepth', 'f');
    this.waterProgram.addUniform('waterColor', 'v4');
    this.waterProgram.addUniform('pMatrix', 'm4', pm);
    this.waterProgram.addUniform('mvMatrix', 'm4');
    
    this.program.setViewport(0, 0, viewWidth, viewHeight);
    this.waterProgram.setViewport(0, 0, viewWidth, viewHeight);

    this.numIndecies = (2 * width) * (height - 1) + 3 * (height - 1);
    this.buildGeometry(width, height);
  
    this.params = {
      lightness: 0.2,
      colorScale: 5,
      waterVisDepth: 0.001,
      waterColor: [0, 75, 150],
      waterAlpha: .3,
      waterColorF: [0, .3, .6, .3],
      renderWater: true,
      renderTerrain: true
    };
  }
  
  TerrainVisualizer.prototype = {
    renderTerrain: function (matrix, erosion) {
      this.program.setUniform('mvMatrix', matrix);
      this.program.setUniform('erosion', erosion);
      this.program.setUniform('lightness', this.params.lightness);
      this.program.setUniform('colorScale', this.params.colorScale);
      this.program.draw(0, this.numIndecies);
    },
    
    renderWater: function (matrix, erosion) {
      this.waterProgram.setUniform('mvMatrix', matrix);
      this.waterProgram.setUniform('erosion', erosion);
      this.waterProgram.setUniform('waterColor', this.params.waterColorF);
      this.waterProgram.setUniform('waterVisDepth', this.params.waterVisDepth);
      this.waterProgram.draw(0, this.numIndecies);
    },
    
    buildGeometry: function (w, h) {
      var w1 = w - 1;
      var h1 = h - 1;

      var i, j, y, y1, d = true;
      var numVerts = w * h;
      var vertecies = [];
      var indecies = [];
      var sx = 1 / w ;
      var sy = 1 / h;
    
      for (i = 0; i < h; i++) {
        for (j = 0; j < w; j++) {
          var x = sx * j + sx * 0.5;
          var y = sy * i + sy * 0.5;
          vertecies.push(x, y);
        }
      }

      for (i = 0; i < h1; i++) {
        y = i * w;
        y1 = y + w;
        if (d) {
          for (j = 0; j < w; j++) {
            indecies.push(y+j, y1+j);
          }
          indecies.push(y1+w1, y1+w1, y1+w1);
        } else {
          for (j = w1; j >= 0; j--) {
            indecies.push(y+j, y1+j);
          }
          indecies.push(y1, y1, y1);
        }
        d = !d;
      }
    
      var position = new DataBuffer(2, numVerts, new Float32Array(vertecies));
      this.program.addAttribute('coords', 2, gl.FLOAT, position);
      this.waterProgram.addAttribute('coords', 2, gl.FLOAT, position);
      var indecies = new IndexBuffer(4, this.numIndecies, new Uint32Array(indecies), gl.UNSIGNED_INT);
      this.program.setIndexBuffer(indecies);
      this.waterProgram.setIndexBuffer(indecies);
    }
  };
  
  
}());