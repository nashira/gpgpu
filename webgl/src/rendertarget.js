var RenderTarget;
(function () {
  RenderTarget = function (width, height) {
    this.width = width;
    this.height = height;
    this.wrapS = gl.CLAMP_TO_EDGE;
    this.wrapT = gl.CLAMP_TO_EDGE;
    this.magFilter = gl.NEAREST;
    this.minFilter = gl.NEAREST;
    this.format = gl.RGBA;
    this.type = gl.UNSIGNED_BYTE;
    this.texture = null;
    this.framebuffer = null;
    this.renderBuffer = null;
    this.init();
  }

  RenderTarget.prototype.init = function () {
    this.texture = gl.createTexture();
    this.framebuffer = gl.createFramebuffer();
    this.renderbuffer = gl.createRenderbuffer();
    this.initTexture();

  	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
  
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, this.width, this.height)
  }

  RenderTarget.prototype.initTexture = function () {
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, 0, this.format, this.type, null);
  }
}());