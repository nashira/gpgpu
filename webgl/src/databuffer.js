var DataBuffer;
(function () {
  DataBuffer = function (itemSize, numItems) {
    this.glBuffer = gl.createBuffer();
    this.itemSize = itemSize;
    this.numItems = numItems;
  }

  DataBuffer.prototype.setBuffer = function (arrayBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, arrayBuffer, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}());