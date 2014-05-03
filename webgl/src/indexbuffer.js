var IndexBuffer;
(function () {
  var gl;
  IndexBuffer = function (itemSize, numItems, data, type) {
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
}());