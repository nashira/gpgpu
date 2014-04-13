var RenderTarget;
(function () {
  RenderTarget = function (width, height) {
    this.width = width;
    this.height = height;
    this.texture = null;
    this.framebuffer = null;
    this.renderBuffer = null;
    this.init();
  }

  RenderTarget.prototype.init = function () {
    this.texture = new Texture(this.width, this.height);
    this.texture.init().setData(null);
    this.framebuffer = gl.createFramebuffer();
    this.renderbuffer = gl.createRenderbuffer();

  	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.glTexture, 0);
  
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, this.width, this.height)
  }
  
  RenderTarget.prototype.getGlTexture = function () {
    return this.texture && this.texture.glTexture;
  }
}());