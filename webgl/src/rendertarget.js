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
