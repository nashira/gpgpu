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
    var self = this;
    Utils.loadImage(params.image, function (img) {
      self.width = width;
      self.height = height;
      self.setImage(img);
      if (params.onLoad) {
        params.onLoad(self, img);
      }
    });
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
