var Program;
(function () {
  Program = function (vertexShader, fragmentShader, params) {
    params = params || {};
    this.attributes = {};
    this.uniforms = {};
    this.viewport = {x: 0, y: 0, w: 1, h: 1};
    this.glProgram = null;
    this.renderTarget = null;
    this.framebuffer = null;
    this.renderbuffer = null;
    this.indexBuffer = null;
    this.blendEnabled = false;
    this.blendEquation = gl.FUNC_ADD;
    this.blendFunc = [gl.SRC_ALPHA, gl.ONE];
    this.drawMode = params.drawMode || gl.TRIANGLES;
    // this.drawFirst = 0;
    // this.drawCount = 0;
  
    if (vertexShader && fragmentShader) {
      this.buildProgram(vertexShader, fragmentShader);
    }
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
      gl.useProgram(this.glProgram);
      var attr = this.attributes[name];
      attr.location = gl.getAttribLocation(this.glProgram, name);
      console.log('initAttribute', name, attr.location);
    }
  }
  
  Program.prototype.initUniform = function (name) {
    if (this.glProgram != null) {
      gl.useProgram(this.glProgram);
      var uni = this.uniforms[name];
      uni.location = gl.getUniformLocation(this.glProgram, name);
      console.log('addUniform', name, uni.location);
    }
  }

  Program.prototype.addAttribute = function (name, size, type) {
    var attr = this.attributes[name] = {
      name: name,
      location: -1,
      size: size || 4,
      type: type || gl.FLOAT,
      stride: 0,
      offset: 0,
      buffer: null
    }
    this.initAttribute(name);
  }

  Program.prototype.setAttributeBuffer = function (name, buffer) {
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
    var uni = this.uniforms[name];
    uni.value = value;
  }
  
  Program.prototype.loadUniforms = function () {
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
          gl.uniform1i(uni.location, uni.value);
        break;
      }
    }
  }
  
  Program.prototype.setIndecies = function (array) {
    this.useIndecies = true;
    this.indexBuffer = gl.createBuffer();
    
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(array), gl.STATIC_DRAW);
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    
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
  
    var vp = this.viewport;
    gl.viewport(vp.x, vp.y, vp.w, vp.h);
    
    this.loadUniforms();
    this.loadAttributes();
    
    if (this.indexBuffer != null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(this.drawMode, count, gl.UNSIGNED_SHORT, first * 2);
    } else {
      gl.drawArrays(this.drawMode, first, count);
    }

    this.unloadAttributes();
  }
}());