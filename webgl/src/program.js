var Program;
(function () {
  Program = function (vertexShader, fragmentShader, params) {
    params = params || {};
    this.attributes = {};
    this.uniforms = {};
    this.viewport = {x: 0, y: 0, w: 500, h: 500};
    this.glProgram = null;
    this.renderTarget = null;
    this.framebuffer = null;
    this.drawMode = params.drawMode || gl.TRIANGLES;
    // this.drawFirst = 0;
    // this.drawCount = 0;
  
    if (vertexShader && fragmentShader) {
      this.buildProgram(vertexShader, fragmentShader);
    }
  }

  Program.prototype.buildProgram = function (vertexShader, fragmentShader) {
    var vertextShaderId = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertextShaderId, vertextShader);
    gl.compileShader(vertextShaderId);
    console.log('getShaderInfoLog', gl.getShaderInfoLog(vertextShaderId));

    gl.shaderSource(fragmentShaderId, fragmentShader);
    gl.compileShader(fragmentShaderId);
    console.log('getShaderInfoLog', gl.getShaderInfoLog(fragmentShaderId));

    this.glProgram = gl.createProgram();
    console.log(this.glProgram);

    gl.attachShader(this.glProgram, vertextShaderId);
    gl.attachShader(this.glProgram, fragmentShaderId);
    gl.linkProgram(this.glProgram);
  
    console.log('LINK_STATUS', gl.getProgramParameter(this.glProgram, gl.LINK_STATUS));
    console.log('VALIDATE_STATUS', gl.getProgramParameter(this.glProgram, gl.VALIDATE_STATUS));
    console.log('getError', gl.getError());
    console.log('getProgramInfoLog', gl.getProgramInfoLog(this.glProgram));
  
    gl.deleteShader(fragmentShaderId);
    gl.deleteShader(vertextShaderId);
  }

  Program.prototype.initAttributes = function () {
    gl.useProgram(this.glProgram);
  
    for (var k in this.attributes) {
      var attr = this.attributes[k];
      attr.location = gl.getAttribLocation(this.glProgram, k);
      console.log('getAttribLocation', k, attr.location);
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
    if (this.glProgram != null) {
      attr.location = gl.getAttribLocation(this.glProgram, name);
      console.log('addAttribute', name, attr.location);
    }
  }

  Program.prototype.setAttributeBuffer = function (name, buffer) {
    var attr = this.attributes[name];
    attr.buffer = buffer;
  }

  Program.prototype.setRenderTarget = function (renderTarget, setViewport) {
    this.renderTarget = renderTarget;
    this.framebuffer = (renderTarget && renderTarget.framebuffer) || null;
  
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
  
    var vp = this.viewport;
    gl.viewport(vp.x, vp.y, vp.w, vp.h);
  
    for (var k in this.attributes) {
      var attr = this.attributes[k];
      gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer.glBuffer);
      gl.vertexAttribPointer(attr.location, attr.size, attr.type, false, attr.stride, attr.offset);
      gl.enableVertexAttribArray(attr.location);
    }
  
    gl.drawArrays(this.drawMode, first, count);
  }
}());