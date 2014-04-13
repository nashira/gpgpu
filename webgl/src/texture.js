var Texture;

(function () {
  Texture = function (width, height, params) {
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
  }
  
  Texture.prototype.init = function () {
    this.glTexture = gl.createTexture();
    this.applyParameters();
    return this;
  }
  
  Texture.prototype.applyParameters = function () {
    gl.bindTexture(gl.TEXTURE_2D, this.glTexture)
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
  	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
  }
  
  Texture.prototype.setData = function (data) {
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, 0, this.format, this.type, data);
  }
}());