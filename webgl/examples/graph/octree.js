var Octree;

(function () {
  Octree = function () {

  }

  Octree.prototype.getTextureSize = function (cubeSize) {
    var w = 1, h = 1;

    while (w * h < cubeSize) {
      w *= 2;
      if (w * h >= cubeSize) break;
      h *= 2;
    }

    return {
      size: cubeSize,
      slicesPerRow: w,
      numRows: h,
      width: w * cubeSize,
      height: h * cubeSize
    }
  }
}());
