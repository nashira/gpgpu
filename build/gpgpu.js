require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"gpgpu":[function(require,module,exports){
module.exports=require('epB21t');
},{}],"epB21t":[function(require,module,exports){

var DataBuffer = require('./webgl/src/databuffer');
var IndexBuffer = require('./webgl/src/indexbuffer');
var Program = require('./webgl/src/program');
var RenderTarget = require('./webgl/src/rendertarget');
var ShaderLib = require('./webgl/src/shaderlib');
var Texture = require('./webgl/src/texture');
var Utils = require('./webgl/src/utils');

module.exports = {
  DataBuffer: DataBuffer,
  IndexBuffer: IndexBuffer,
  Program: Program,
  RenderTarget: RenderTarget,
  ShaderLib: ShaderLib,
  Texture: Texture,
  Matrix: Utils.Matrix,
  Camera: Utils.Camera,
  Utils: Utils.Utils
}

},{"./webgl/src/databuffer":3,"./webgl/src/indexbuffer":4,"./webgl/src/program":5,"./webgl/src/rendertarget":6,"./webgl/src/shaderlib":7,"./webgl/src/texture":8,"./webgl/src/utils":9}],3:[function(require,module,exports){

var gl;

var DataBuffer = function (itemSize, numItems, data) {
  this.glBuffer = gl.createBuffer();
  this.itemSize = itemSize;
  this.numItems = numItems;
  if (data) {
    this.setData(data);
  }
}

DataBuffer.init = function (_gl) {
  gl = _gl;
}

DataBuffer.prototype.setData = function (data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

module.exports = DataBuffer;

},{}],4:[function(require,module,exports){

var gl;

var IndexBuffer = function (itemSize, numItems, data, type) {
  this.glBuffer = gl.createBuffer();
  this.itemSize = itemSize;
  this.numItems = numItems;
  this.type = type || gl.UNSIGNED_SHORT;
  if (data) {
    this.setData(data);
  }
}

IndexBuffer.init = function (_gl) {
  gl = _gl;
}

IndexBuffer.prototype.setData = function (data) {
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}
module.exports = IndexBuffer;

},{}],5:[function(require,module,exports){

var DataBuffer = require('./databuffer');
var IndexBuffer = require('./indexbuffer');
var RenderTarget = require('./rendertarget');
var Texture = require('./texture');

var gl;

var log = function () {}

var Program = function (vertexShader, fragmentShader, params) {
  params = params || {};
  this.attributes = {};
  this.uniforms = {};
  this.glProgram = null;
  this.renderTarget = null;
  this.framebuffer = null;
  this.renderbuffer = null;
  this.indexBuffer = null;
  this.textureCount = 0;
  this.viewport = params.viewport || {x: 0, y: 0, w: 1, h: 1};
  this.blendEnabled = params.blendEnabled || false;
  this.blendEquation = params.blendEquation || gl.FUNC_ADD;
  this.blendFunc = params.blendFunc || [gl.SRC_ALPHA, gl.ONE];
  this.drawMode = 'drawMode' in params ? params.drawMode : gl.TRIANGLES;
  this.cullFace = 'cullFace' in params ? params.cullFace : null;
  this.depthTest = 'depthTest' in params ? params.depthTest : true;
  this.clear = 'clear' in params ? params.clear : (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // this.drawFirst = 0;
  // this.drawCount = 0;

  if (vertexShader && fragmentShader) {
    this.buildProgram(vertexShader, fragmentShader);
  }
}

Program.gl = gl;
Program.init = function (_gl) {
  gl = _gl;
  DataBuffer.init(gl);
  IndexBuffer.init(gl);
  RenderTarget.init(gl);
  Texture.init(gl);

  gl.getExtension('OES_texture_float');
  gl.getExtension('OES_texture_float_linear');
  gl.getExtension('OES_standard_derivatives');
  gl.getExtension('OES_element_index_uint');
}

Program.prototype.buildProgram = function (vertexShader, fragmentShader) {
  var vertexShaderId = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShaderId, vertexShader);
  gl.compileShader(vertexShaderId);
  log('getShaderInfoLog', gl.getShaderInfoLog(vertexShaderId));

  gl.shaderSource(fragmentShaderId, fragmentShader);
  gl.compileShader(fragmentShaderId);
  log('getShaderInfoLog', gl.getShaderInfoLog(fragmentShaderId));

  this.glProgram = gl.createProgram();
  log(this.glProgram);

  gl.attachShader(this.glProgram, vertexShaderId);
  gl.attachShader(this.glProgram, fragmentShaderId);
  gl.linkProgram(this.glProgram);

  if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
    log('VALIDATE_STATUS', gl.getProgramParameter(this.glProgram, gl.VALIDATE_STATUS));
    log('getError', gl.getError());
  }
  log('getProgramInfoLog', gl.getProgramInfoLog(this.glProgram));

  gl.deleteShader(vertexShaderId);
  gl.deleteShader(fragmentShaderId);
}

Program.prototype.initAttribute = function (name) {
  if (this.glProgram != null) {
    // gl.useProgram(this.glProgram);
    var attr = this.attributes[name];
    attr.location = gl.getAttribLocation(this.glProgram, name);
    log('initAttribute', name, attr.location);
  }
}

Program.prototype.initUniform = function (name) {
  if (this.glProgram != null) {
    // gl.useProgram(this.glProgram);
    var uni = this.uniforms[name];
    uni.location = gl.getUniformLocation(this.glProgram, name);
    log('initUniform', name, uni.location);
  }
}

Program.prototype.addAttribute = function (name, size, type, buffer) {
  var attr = this.attributes[name] = {
    name: name,
    location: -1,
    size: size || 4,
    type: type || gl.FLOAT,
    stride: 0,
    offset: 0,
    buffer: buffer || null
  }
  this.initAttribute(name);
}

Program.prototype.setAttribute = function (name, buffer) {
  var attr = this.attributes[name];
  attr.buffer = buffer;
}

Program.prototype.loadAttributes = function () {
  for (var k in this.attributes) {
    var attr = this.attributes[k];
    gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer.glBuffer);
    gl.vertexAttribPointer(attr.location, attr.size, attr.type, false, attr.stride, attr.offset);
    gl.enableVertexAttribArray(attr.location);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

Program.prototype.unloadAttributes = function () {
  for (var k in this.attributes) {
    var attr = this.attributes[k];
    gl.disableVertexAttribArray(attr.location);
  }
}

Program.prototype.addUniform = function (name, type, value) {
  var uni = this.uniforms[name] = {
    name: name,
    location: -1,
    type: type || 'f',
    value: value || null
  }
  this.initUniform(name);
}

Program.prototype.setUniform = function (name, value) {
  this.uniforms[name].value = value;
}

Program.prototype.loadUniforms = function () {
  var textureCount = 0;
  for (var name in this.uniforms) {
    var uni = this.uniforms[name];

    switch (uni.type) {
      case 'i':
        gl.uniform1i(uni.location, uni.value);
      break; case 'f':
        gl.uniform1f(uni.location, uni.value);
      break; case 'v2':
        gl.uniform2f(uni.location, uni.value[0], uni.value[1]);
      break; case 'v3':
        gl.uniform3f(uni.location, uni.value[0], uni.value[1], uni.value[2]);
      break; case 'v4':
        gl.uniform4f(uni.location, uni.value[0], uni.value[1], uni.value[2], uni.value[3]);
      break; case 'm4':
        gl.uniformMatrix4fv(uni.location, false, uni.value);
      break; case 't':
        var unit = textureCount++;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, uni.value);
        gl.uniform1i(uni.location, unit);
      break;
    }
  }
}

Program.prototype.setIndexBuffer = function (indexBuffer) {
  this.indexBuffer = indexBuffer;
}

Program.prototype.setRenderTarget = function (renderTarget, setViewport) {
  this.renderTarget = renderTarget;
  this.framebuffer = (renderTarget && renderTarget.framebuffer) || null;
  this.renderbuffer = (renderTarget && renderTarget.renderbuffer) || null;

  if (renderTarget && setViewport) {
    this.setViewport(0, 0, renderTarget.width, renderTarget.height);
  }
}

Program.prototype.setViewport = function (x, y, w, h) {
  this.viewport = {x: x, y: y, w: w, h: h};
}

Program.prototype.draw = function (first, count) {
  gl.useProgram(this.glProgram);
  if (Program.framebuffer !== this.framebuffer) {
    Program.framebuffer = this.framebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    // gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
  }

  if (this.renderTarget) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderTarget.getGlTexture(), 0);
  }

  if (this.clear) {
    gl.clear(this.clear);
  }

  if (this.blendEnabled) {
    gl.enable(gl.BLEND);
    if (this.blendEquation.length) {
      gl.blendEquationSeparate(this.blendEquation[0], this.blendEquation[1]);
    } else {
      gl.blendEquation(this.blendEquation);
    }
    if (this.blendFunc.length == 4) {
      gl.blendFuncSeparate(this.blendFunc[0], this.blendFunc[1], this.blendFunc[2], this.blendFunc[3]);
    } else {
      gl.blendFunc(this.blendFunc[0], this.blendFunc[1]);
    }
  } else {
    gl.disable(gl.BLEND);
  }

  if (this.depthTest) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }

  if (this.cullFace != null) {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(this.cullFace);
  } else {
    gl.disable(gl.CULL_FACE);
  }

  var vp = this.viewport;
  gl.viewport(vp.x, vp.y, vp.w, vp.h);

  this.loadAttributes();
  this.loadUniforms();

  if (this.indexBuffer != null) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer.glBuffer);
    gl.drawElements(this.drawMode, count, this.indexBuffer.type, first * this.indexBuffer.itemSize);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  } else {
    gl.drawArrays(this.drawMode, first, count);
  }

  this.unloadAttributes();
}

module.exports = Program;

},{"./databuffer":3,"./indexbuffer":4,"./rendertarget":6,"./texture":8}],6:[function(require,module,exports){
var Texture = require('./texture');

var gl;

var RenderTarget = function (width, height, params) {
  this.width = width;
  this.height = height;
  this.texture = null;
  this.framebuffer = null;
  this.renderBuffer = null;
  this.init(params || {});
}

RenderTarget.init = function (_gl) {
  gl = _gl;
}

RenderTarget.prototype.init = function (params) {
  this.texture = new Texture(this.width, this.height, params);
  if (!params.data) {
    this.texture.init().setData(null);
  }
  this.framebuffer = gl.createFramebuffer();
  // this.renderbuffer = gl.createRenderbuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.glTexture, 0);

  // gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
  // gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, this.width, this.height)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}

RenderTarget.prototype.getGlTexture = function () {
  return this.texture && this.texture.glTexture;
}

module.exports = RenderTarget;

},{"./texture":8}],7:[function(require,module,exports){
// some portions are licensed by:
// Copyright (C) 2011 by Ashima Arts (Simplex noise)
// Copyright (C) 2011 by Stefan Gustavson (Classic noise)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

var ShaderLib = {};

  ShaderLib.noise3d = [
  '//',
  '// Description : Array and textureless GLSL 2D/3D/4D simplex ',
  '//               noise functions.',
  '//      Author : Ian McEwan, Ashima Arts.',
  '//  Maintainer : ijm',
  '//     Lastmod : 20110822 (ijm)',
  '//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.',
  '//               Distributed under the MIT License. See LICENSE file.',
  '//               https://github.com/ashima/webgl-noise',
  '// ',
  '',
  'vec3 mod289(vec3 x) {',
  '  return x - floor(x * (1.0 / 289.0)) * 289.0;',
  '}',
  '',
  'vec4 mod289(vec4 x) {',
  '  return x - floor(x * (1.0 / 289.0)) * 289.0;',
  '}',
  '',
  'vec4 permute(vec4 x) {',
  '     return mod289(((x*34.0)+1.0)*x);',
  '}',
  '',
  'vec4 taylorInvSqrt(vec4 r)',
  '{',
  '  return 1.79284291400159 - 0.85373472095314 * r;',
  '}',
  '',
  'float snoise(vec3 v)',
  '{',
  '  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;',
  '  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);',
  '',
  '// First corner',
  '  vec3 i  = floor(v + dot(v, C.yyy) );',
  '  vec3 x0 =   v - i + dot(i, C.xxx) ;',
  '',
  '// Other corners',
  '  vec3 g = step(x0.yzx, x0.xyz);',
  '  vec3 l = 1.0 - g;',
  '  vec3 i1 = min( g.xyz, l.zxy );',
  '  vec3 i2 = max( g.xyz, l.zxy );',
  '',
  '  //   x0 = x0 - 0.0 + 0.0 * C.xxx;',
  '  //   x1 = x0 - i1  + 1.0 * C.xxx;',
  '  //   x2 = x0 - i2  + 2.0 * C.xxx;',
  '  //   x3 = x0 - 1.0 + 3.0 * C.xxx;',
  '  vec3 x1 = x0 - i1 + C.xxx;',
  '  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y',
  '  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y',
  '',
  '// Permutations',
  '  i = mod289(i); ',
  '  vec4 p = permute( permute( permute( ',
  '             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))',
  '           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) ',
  '           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));',
  '',
  '// Gradients: 7x7 points over a square, mapped onto an octahedron.',
  '// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)',
  '  float n_ = 0.142857142857; // 1.0/7.0',
  '  vec3  ns = n_ * D.wyz - D.xzx;',
  '',
  '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)',
  '',
  '  vec4 x_ = floor(j * ns.z);',
  '  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)',
  '',
  '  vec4 x = x_ *ns.x + ns.yyyy;',
  '  vec4 y = y_ *ns.x + ns.yyyy;',
  '  vec4 h = 1.0 - abs(x) - abs(y);',
  '',
  '  vec4 b0 = vec4( x.xy, y.xy );',
  '  vec4 b1 = vec4( x.zw, y.zw );',
  '',
  '  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;',
  '  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;',
  '  vec4 s0 = floor(b0)*2.0 + 1.0;',
  '  vec4 s1 = floor(b1)*2.0 + 1.0;',
  '  vec4 sh = -step(h, vec4(0.0));',
  '',
  '  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;',
  '  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;',
  '',
  '  vec3 p0 = vec3(a0.xy,h.x);',
  '  vec3 p1 = vec3(a0.zw,h.y);',
  '  vec3 p2 = vec3(a1.xy,h.z);',
  '  vec3 p3 = vec3(a1.zw,h.w);',
  '',
  '//Normalise gradients',
  '  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));',
  '  p0 *= norm.x;',
  '  p1 *= norm.y;',
  '  p2 *= norm.z;',
  '  p3 *= norm.w;',
  '',
  '// Mix final noise value',
  '  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);',
  '  m = m * m;',
  '  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), ',
  '                                dot(p2,x2), dot(p3,x3) ) );',
  '}'].join('\n');

  ShaderLib.noise2d = [
  '//',
  '// Description : Array and textureless GLSL 2D simplex noise function.',
  '//      Author : Ian McEwan, Ashima Arts.',
  '//  Maintainer : ijm',
  '//     Lastmod : 20110822 (ijm)',
  '//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.',
  '//               Distributed under the MIT License. See LICENSE file.',
  '//               https://github.com/ashima/webgl-noise',
  '// ',
  '',
  'vec3 mod289(vec3 x) {',
  '  return x - floor(x * (1.0 / 289.0)) * 289.0;',
  '}',
  '',
  'vec2 mod289(vec2 x) {',
  '  return x - floor(x * (1.0 / 289.0)) * 289.0;',
  '}',
  '',
  'vec3 permute(vec3 x) {',
  '  return mod289(((x*34.0)+1.0)*x);',
  '}',
  '',
  'float snoise(vec2 v)',
  '  {',
  '  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0',
  '                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)',
  '                     -0.577350269189626,  // -1.0 + 2.0 * C.x',
  '                      0.024390243902439); // 1.0 / 41.0',
  '// First corner',
  '  vec2 i  = floor(v + dot(v, C.yy) );',
  '  vec2 x0 = v -   i + dot(i, C.xx);',
  '',
  '// Other corners',
  '  vec2 i1;',
  '  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0',
  '  //i1.y = 1.0 - i1.x;',
  '  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
  '  // x0 = x0 - 0.0 + 0.0 * C.xx ;',
  '  // x1 = x0 - i1 + 1.0 * C.xx ;',
  '  // x2 = x0 - 1.0 + 2.0 * C.xx ;',
  '  vec4 x12 = x0.xyxy + C.xxzz;',
  '  x12.xy -= i1;',
  '',
  '// Permutations',
  '  i = mod289(i); // Avoid truncation effects in permutation',
  '  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))',
  '    + i.x + vec3(0.0, i1.x, 1.0 ));',
  '',
  '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
  '  m = m*m ;',
  '  m = m*m ;',
  '',
  '// Gradients: 41 points uniformly over a line, mapped onto a diamond.',
  '// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)',
  '',
  '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
  '  vec3 h = abs(x) - 0.5;',
  '  vec3 ox = floor(x + 0.5);',
  '  vec3 a0 = x - ox;',
  '',
  '// Normalise gradients implicitly by scaling m',
  '// Approximation of: m *= inversesqrt( a0*a0 + h*h );',
  '  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );',
  '',
  '// Compute final noise value at P',
  '  vec3 g;',
  '  g.x  = a0.x  * x0.x  + h.x  * x0.y;',
  '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
  '  return 130.0 * dot(m, g);',
  '}'].join('\n');

module.exports = ShaderLib;

},{}],8:[function(require,module,exports){
var Utils = require('./utils').Utils;

var gl, DEFAULT_TEXTURE_DATA;

var Texture = function (width, height, params) {
  params = params || {};
  this.width = width;
  this.height = height;
  this.wrapS = params.wrapS || gl.CLAMP_TO_EDGE;
  this.wrapT = params.wrapT || gl.CLAMP_TO_EDGE;
  this.magFilter = params.magFilter || gl.NEAREST;
  this.minFilter = params.minFilter || gl.NEAREST;
  this.format = params.format || gl.RGBA;
  this.type = params.type || gl.UNSIGNED_BYTE;
  this.glTexture = params.glTexture || null;

  if (params.image && typeof(params.image) == 'string') {
    this.width = 1;
    this.height = 1;
    this.init();
    this.setData(DEFAULT_TEXTURE_DATA);
    Utils.loadImage(params.image, function (img) {
      this.width = width;
      this.height = height;
      this.setImage(img);
      if (params.onLoad) {
        params.onLoad(this, img);
      }
    }.bind(this));
  } else if (params.image) {
    this.init();
    this.setImage(params.image);
  } else if (params.data) {
    this.init();
    this.setData(params.data);
  } else if (this.glTexture) {
    this.applyParameters();
  }
}

Texture.init = function (_gl) {
  gl = _gl;
  DEFAULT_TEXTURE_DATA = new Uint8Array([0, 0, 0, 0]);
}

Texture.isPower2 = function (value) {
  return (value & (value - 1)) == 0 && value != 0;
}

Texture.prototype.init = function () {
  this.glTexture = gl.createTexture();
  this.applyParameters();
  return this;
}

Texture.prototype.applyParameters = function () {
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

Texture.prototype.setImage = function (image) {
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, image);
  if (Texture.isPower2(this.width) && Texture.isPower2(this.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
}

Texture.prototype.setData = function (data) {
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, 0, this.format, this.type, data);
  if (Texture.isPower2(this.width) && Texture.isPower2(this.height)) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
}

Texture.prototype.generateMipmap = function () {
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

module.exports = Texture;

},{"./utils":9}],9:[function(require,module,exports){
/*
Quaternions License:

The MIT License

Copyright &copy; 2010-2014 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var DataBuffer = require('./databuffer');
var ShaderLib = require('./shaderlib');

// var path = require('path');

var Utils = {};

Utils.getTextureIndecies = function (width, height, limit, keepData) {
  limit = limit || (width * height);
  var data = [];
  var dw = 1 / width;
  var dh = 1 / height;
  for (var i = dh * 0.5; i < 1; i += dh) {
    for (var j = dw * 0.5; j < 1; j += dw) {
      data.push(j, i);
      if (data.length / 2 >= limit) {
        break;
      }
    }
    if (data.length / 2 >= limit) {
      break;
    }
  }
  // console.log('getTextureIndecies', data);
  var db = new DataBuffer(2, limit, new Float32Array(data));
  if (keepData) db.data = data;
  return db;
}

Utils.getPotSize = function (num) {
  var w = 1, h = 1;

  while (w * h < num) {
    w *= 2;
    if (w * h >= num) break;
    h *= 2;
  }

  return {w: w, h: h};
}

Utils.loadImage = function (url, onLoad) {
  var image = new Image();
  image.onload = function () {
    onLoad(image);
  };
  image.src = url;
}

Utils.loadFile = function (url, onLoad) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = "arraybuffer";
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (onLoad) {
        onLoad(xhr);
      }
    }
  }
  xhr.open('GET', url, true);
  xhr.send();
}

Utils.loadShaders = function (urls) {
  var libre = /\$\{([^}]*)\}/g;
  var results = urls.map(function () {
    return false;
  });

  urls.forEach(function (url, index) {
    fs.readFile(url, 'utf8', function (error, file) {
      if (error) console.log(error)
        var text = file;

        var match;
        while (match = libre.exec(text)) {
          text = text.replace(match[0], ShaderLib[match[1]]);
        }

        results[index] = text;

        if (onLoad && results.every(function (r) {
          return r;
        })) {
          onLoad(results);
        }
      });
  });
}

var Camera = function (fov, aspect, near, far) {
  this.position = [0, 0, -1];
  this.lookAt = [0, 0, 0];
  this.up = [0, 1, 0];
  this.quaternion = new Quaternion();
  this.tmpQuat = new Quaternion();

  this.perspective = [];
  this.world = [];
  this._matrix = [];
  this.v1 = [];
  this.v2 = [];
  this.v3 = [];

  this.setPerspective(fov, aspect, near, far);
}

Camera.prototype = {
  matrix: function () {
    if (this.needsUpdate) {
      this.updateMatrix();
      this.needsUpdate = false;
    }
    return this._matrix;
  },

  setPerspective: function (fov, aspect, near, far) {
    this.perspective = Matrix.makePerspective(fov, aspect, near, far);
    this.needsUpdate = true;
  },

  setPosition: function (x, y, z) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this.needsUpdate = true;
  },

  setLookAt: function (x, y, z) {
    this.lookAt[0] = x;
    this.lookAt[1] = y;
    this.lookAt[2] = z;
    this.needsUpdate = true;
  },

  setUp: function (x, y, z) {
    this.up[0] = x;
    this.up[1] = y;
    this.up[2] = z;
    this.needsUpdate = true;
  },

  zoom: function (z) {
    var a = minus(this.position, this.lookAt, this.v1);
    mults(a, z);
    add(this.lookAt, a, this.position);
    this.needsUpdate = true;
  },

  orbit: function (x, y) {
    var a = this.v1;
    a[0] = x;
    a[1] = y;
    a[2] = 0;
    this.quaternion.rotVec(a);
    this.tmpQuat.fromEuler(a[0], a[1], a[2]);
    minus(this.position, this.lookAt, a);
    this.tmpQuat.rotVec(a);
    add(this.lookAt, a, this.position);
    this.tmpQuat.rotVec(this.up);

    this.tmpQuat.fromEuler(x, y, 0);
    this.quaternion.multiply(this.tmpQuat);
    this.needsUpdate = true;
  },

  updateMatrix: function () {
    var eye = this.position;
    var at = this.lookAt;
    var up = this.up;

    var zaxis = norm(minus(eye, at, this.v1));
    var xaxis = norm(cross(up, zaxis, this.v2));
    var yaxis = cross(zaxis, xaxis, this.v3);

    this.world[0] = xaxis[0]; this.world[1] = yaxis[0];
    this.world[2] = zaxis[0]; this.world[3] = 0;
    this.world[4] = xaxis[1]; this.world[5] = yaxis[1];
    this.world[6] = zaxis[1]; this.world[7] = 0;
    this.world[8] = xaxis[2]; this.world[9] = yaxis[2];
    this.world[10] = zaxis[2]; this.world[11] = 0;
    this.world[12] = -dot(xaxis, eye); this.world[13] = -dot(yaxis, eye);
    this.world[14] = -dot(zaxis, eye); this.world[15] = 1;
    Matrix.multiplyMatrix(this.world, this.perspective, this._matrix);
  }
};

var Quaternion = function (x, y, z, w) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

Quaternion.prototype = {
  fromAngle: function (x, y, z, angle) {
    var halfAngle = angle / 2, s = Math.sin(halfAngle);

    this.x = x * s;
    this.y = y * s;
    this.z = z * s;
    this.w = Math.cos(halfAngle);
  },

  fromEuler: function (x, y, z) {
    var c1 = Math.cos(x / 2);
    var c2 = Math.cos(y / 2);
    var c3 = Math.cos(z / 2);
    var s1 = Math.sin(x / 2);
    var s2 = Math.sin(y / 2);
    var s3 = Math.sin(z / 2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
  },

  length: function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  },

  normalize: function () {
    var l = this.length();
    if (l == 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;
      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }
  },

  multiply: function (b) {
    var a = this;
    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
  },

  rotVec: function (v) {
    var x = v[0];
    var y = v[1];
    var z = v[2];

    var qx = this.x;
    var qy = this.y;
    var qz = this.z;
    var qw = this.w;

    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = -qx * x - qy * y - qz * z;

    v[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    v[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    v[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  },

  invert: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    this.normalize();
    return this;
  }
};


function norm(a, r) {
  r = r || a;
  var sqrt = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
  r[0] = a[0]/sqrt;
  r[1] = a[1]/sqrt;
  r[2] = a[2]/sqrt;
  return r;
}

function minus(a, b, r) {
  r[0] = a[0] - b[0];
  r[1] = a[1] - b[1];
  r[2] = a[2] - b[2];
  return r;
}

function add(a, b, r) {
  r[0] = a[0] + b[0];
  r[1] = a[1] + b[1];
  r[2] = a[2] + b[2];
  return r;
}

function mults(a, s) {
  a[0] = a[0] * s;
  a[1] = a[1] * s;
  a[2] = a[2] * s;
  return a;
}

function cross(a, b, r) {
  r[0] = a[1] * b[2] - a[2] * b[1];
  r[1] = a[2] * b[0] - a[0] * b[2];
  r[2] = a[0] * b[1] - a[1] * b[0];
  return r;
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

var Matrix = {
  normal: function (arr) {
    var sqrt = Math.sqrt(arr[0]*arr[0]+arr[1]*arr[1]+arr[2]*arr[2]);
    return [arr[0]/sqrt, arr[1]/sqrt, arr[2]/sqrt];
  },

  minus: function (a, b) {
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  },

  dot: function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },

  cross: function (a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  },

  makeLookAt: function (eye, at, up) {
    var zaxis = Matrix.normal(Matrix.minus(eye, at));
    var xaxis = Matrix.normal(Matrix.cross(up, zaxis));
    var yaxis = Matrix.cross(zaxis, xaxis);

     return [xaxis[0], yaxis[0], zaxis[0], 0,
             xaxis[1], yaxis[1], zaxis[1], 0,
             xaxis[2], yaxis[2], zaxis[2], 0,
            -Matrix.dot(xaxis, eye), -Matrix.dot(yaxis, eye), -Matrix.dot(zaxis, eye), 1];
  },

  // taken from html5rocks.com
  makePerspective: function(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  },

  makeOrthographic: function (width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  makeTranslation: function (tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
      tx, ty, tz,  1
    ];
  },

  setTranslation: function (m, tx, ty, tz) {
    m[12] = tx;
    m[13] = ty;
    m[14] = tz;
  },

  makeXRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1
    ];
  },

  setXRotation: function(m, angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    m[5] = c;
    m[6] = s;
    m[9] = -s;
    m[10] = c;
  },

  makeYRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1
    ];
  },

  setYRotation: function(m, angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
  },

  makeZRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  setZRotation: function(m, angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
  },

  makeScale: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  setScale: function(m, sx, sy, sz) {
    m[0] = sx;
    m[5] = sy;
    m[10] = sz;
  },

  multiply: function () {
    var m = arguments[1], t = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      Matrix.multiplyMatrix(m, arguments[i], t);
      m = t;
    }
    return m;
  },

  multiplyMatrix: function(a, b, c) {
    c = c || [];
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    var a30 = a[12];
    var a31 = a[13];
    var a32 = a[14];
    var a33 = a[15];
    var b00 = b[0];
    var b01 = b[1];
    var b02 = b[2];
    var b03 = b[3];
    var b10 = b[4];
    var b11 = b[5];
    var b12 = b[6];
    var b13 = b[7];
    var b20 = b[8];
    var b21 = b[9];
    var b22 = b[10];
    var b23 = b[11];
    var b30 = b[12];
    var b31 = b[13];
    var b32 = b[14];
    var b33 = b[15];
    c[0]  = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    c[1]  = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    c[2]  = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    c[3]  = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
    c[4]  = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    c[5]  = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    c[6]  = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    c[7]  = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
    c[8]  = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    c[9]  = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    c[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    c[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
    c[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
    c[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
    c[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
    c[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
    return c;
  }
}

module.exports = {
  Utils: Utils,
  Matrix: Matrix,
  Camera: Camera
}

},{"./databuffer":3,"./shaderlib":7}]},{},[])