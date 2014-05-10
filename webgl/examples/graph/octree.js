var Octree;

(function () {
  Octree = function () {

  }

  Octree.prototype.getTextureSize = function (cubeSize) {
    var d = Utils.getPotSize(cubeSize);

    return {
      size: cubeSize,
      slicesPerRow: d.w,
      numRows: d.h,
      width: d.w * cubeSize,
      height: d.h * cubeSize
    }
  }


}());
