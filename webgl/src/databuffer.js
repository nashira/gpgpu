var DataBuffer;
(function () {
  var gl;
  DataBuffer = function (itemSize, numItems, data) {
    this.glBuffer = gl.createBuffer();
    this.itemSize = itemSize;
    this.numItems = numItems;
    if (data) {
      this.setData(data);
    }
  }
  
  DataBuffer.init = function (_gl) {
    gl = _gl;
  }

  DataBuffer.prototype.setData = function (data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}());