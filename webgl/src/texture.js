var Texture;

(function () {
  var gl, DEFAULT_TEXTURE_DATA;
  
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
    }
  }
  
  Texture.init = function (_gl) {
    gl = _gl;
    DEFAULT_TEXTURE_DATA = new Uint8Array([0, 0, 0, 0]);
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
    gl.bindTexture(gl.TEXTURE_2D, this.glTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, this.type, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  
  Texture.prototype.setData = function (data) {
    gl.bindTexture(gl.TEXTURE_2D, this.glTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, 0, this.format, this.type, data);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}());