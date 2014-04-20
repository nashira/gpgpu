var Program;
(function () {
  var gl;
  
  Program = function (vertexShader, fragmentShader, params) {
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
    // this.drawFirst = 0;
    // this.drawCount = 0;
  
    if (vertexShader && fragmentShader) {
      this.buildProgram(vertexShader, fragmentShader);
    }
    if (params.shaderUrls) {
      Utils.loadFile(params.shaderUrls[0], function (vertext) {
        vertexShader = vertext;
        if (fragmentShader) {
          this.buildProgram(vertexShader, fragmentShader);
          if (params.onLoad) params.onLoad();
        }
      });
      Utils.loadFile(params.shaderUrls[1], function (fragment) {
        fragmentShader = fragment;
        if (vertexShader) {
          this.buildProgram(vertexShader, fragmentShader);
          if (params.onLoad) params.onLoad();
        }
      });
    }
  }

  Program.init = function (_gl) {
    gl = _gl;
    DataBuffer.init(gl);
    RenderTarget.init(gl);
    Texture.init(gl);
    
		gl.getExtension('OES_texture_float');
		gl.getExtension('OES_texture_float_linear');
		gl.getExtension('OES_standard_derivatives');
  }

  Program.prototype.buildProgram = function (vertexShader, fragmentShader) {
    var vertexShaderId = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShaderId, vertexShader);
    gl.compileShader(vertexShaderId);
    console.log('getShaderInfoLog', gl.getShaderInfoLog(vertexShaderId));

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);
    console.log('getShaderInfoLog', gl.getShaderInfoLog(fragmentShaderId));

    this.glProgram = gl.createProgram();
    console.log(this.glProgram);

    gl.attachShader(this.glProgram, vertexShaderId);
    gl.attachShader(this.glProgram, fragmentShaderId);
    gl.linkProgram(this.glProgram);
  
    if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
      console.log('VALIDATE_STATUS', gl.getProgramParameter(this.glProgram, gl.VALIDATE_STATUS));
      console.log('getError', gl.getError());
    }
    console.log('getProgramInfoLog', gl.getProgramInfoLog(this.glProgram));
  
    gl.deleteShader(vertexShaderId);
    gl.deleteShader(fragmentShaderId);
  }
  
  Program.prototype.initAttribute = function (name) {
    if (this.glProgram != null) {
      // gl.useProgram(this.glProgram);
      var attr = this.attributes[name];
      attr.location = gl.getAttribLocation(this.glProgram, name);
      console.log('initAttribute', name, attr.location);
    }
  }
  
  Program.prototype.initUniform = function (name) {
    if (this.glProgram != null) {
      // gl.useProgram(this.glProgram);
      var uni = this.uniforms[name];
      uni.location = gl.getUniformLocation(this.glProgram, name);
      console.log('initUniform', name, uni.location);
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
  
  Program.prototype.setIndecies = function (array) {
    this.useIndecies = true;
    this.indexBuffer = gl.createBuffer();
    
    if (array instanceof Array) {
      array = new Uint16Array(array);
    }
    
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
    
    if (this.blendEnabled) {
      gl.enable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
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
      gl.enable(gl.DEPTH_TEST);
    }
  
    var vp = this.viewport;
    gl.viewport(vp.x, vp.y, vp.w, vp.h);

    this.loadAttributes();
    this.loadUniforms();
    
    if (this.indexBuffer != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(this.drawMode, count, gl.UNSIGNED_SHORT, first * 2);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    } else {
      gl.drawArrays(this.drawMode, first, count);
    }

    this.unloadAttributes();
  }
}());