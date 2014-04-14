var DataBuffer;
(function () {
  var gl;
  DataBuffer = function (itemSize, numItems) {
    this.glBuffer = gl.createBuffer();
    this.itemSize = itemSize;
    this.numItems = numItems;
  }
  
  DataBuffer.init = function (_gl) {
    gl = _gl;
  }

  DataBuffer.prototype.setBuffer = function (arrayBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}());