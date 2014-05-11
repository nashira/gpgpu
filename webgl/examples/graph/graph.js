var Graph;

(function () {
  Graph = function (numItems, depth, onLoad) {
    this.numItems = numItems;
    this.setDepth(depth);
    this.itemTS = Utils.getPotSize(numVertices);
    this.vertCoords = Utils.getTextureIndecies(
      this.itemTS.w, this.itemTS.h, this.numItems);

    console.log('sizeInfo', this.sizeInfo);

    this.init(onLoad);
  }

  Graph.prototype = {
    init: function (onLoad) {
      Utils.loadShaders([
        './initial_posv.glsl',
        './initial_posf.glsl',
        './nbody_octreev.glsl',
        './nbody_octreef.glsl',
        './populate_octreev.glsl',
        './populate_octreef.glsl'], function (shaders) {

          this.initInitialPos(shaders[0], shaders[1]);
          this.initPopulate(shaders[4], shaders[5]);
          this.initNbody(shaders[2], shaders[3]);

        if (onLoad) {
          onLoad();
        }
      }.bind(this));
    },

    initInitialPos: function (vert, frag) {
      var size = this.itemTS;
      this.initialPosProg = new Program(vert, frag, {drawMode: gl.POINTS});
      this.initialPosProg.addAttribute('coords', 2, gl.FLOAT, this.vertCoords);
      this.initialPosProg.addUniform('time', 'f', 0);
      this.positionTarget = new RenderTarget(size.w, size.h, {type: gl.FLOAT});
      this.tempTarget = new RenderTarget(size.w, size.h, {type: gl.FLOAT});
      this.initialPosProg.setRenderTarget(this.positionTarget, true);
    },

    initPopulate: function (vert, frag) {
      this.populateProg = new Program(vert, frag, {
        drawMode: gl.POINTS,
        blendEnabled: true,
        depthTest: false,
        blendFunc: [gl.SRC_ALPHA, gl.ONE]
      });

      var sizeInfo = this.sizeInfo;
      this.octreeTarget = new RenderTarget(sizeInfo.width, sizeInfo.height, {type: gl.FLOAT});
      this.populateProg.addUniform('positionTexture', 't', this.positionTarget.getGlTexture());
      this.populateProg.addUniform('size', 'f', sizeInfo.size);
      this.populateProg.addUniform('slicesPerRow', 'f', sizeInfo.slicesPerRow);
      this.populateProg.addUniform('numRows', 'f', sizeInfo.numRows);
      this.populateProg.addAttribute('coords', 2, gl.FLOAT, this.vertCoords);
      this.populateProg.setRenderTarget(this.octreeTarget, true);
    },

    initNbody: function (vert, frag) {
      this.nbodyProg = new Program(vert, frag, {
        drawMode: gl.POINTS,
        // drawMode: gl.LINE_STRIP,
        blendEnabled: true,
        depthTest: false
      });

      var sizeInfo = this.sizeInfo;
      this.nbodyProg.addAttribute('coords', 2, gl.FLOAT, this.vertCoords);
      this.nbodyProg.addUniform('positionTexture', 't');
      this.nbodyProg.addUniform('octreeTexture', 't', this.octreeTarget.getGlTexture());
      this.nbodyProg.addUniform('lod', 'f');
      // this.nbodyProg.addUniform('matrix', 'm4');
      this.nbodyProg.addUniform('size', 'f', sizeInfo.size);
      this.nbodyProg.addUniform('slicesPerRow', 'f', sizeInfo.slicesPerRow);
      this.nbodyProg.addUniform('numRows', 'f', sizeInfo.numRows);
      var sliceSize = [1 / sizeInfo.slicesPerRow, 1 / sizeInfo.numRows];
      this.nbodyProg.addUniform('sliceSize', 'v2', sliceSize);

      this.mipmapTexture = new Texture(sizeInfo.width, sizeInfo.height, {
        type: gl.FLOAT,
        minFilter: gl.NEAREST_MIPMAP_NEAREST,
        magFilter: gl.NEAREST
      });

      this.mipmapTexture.glTexture = this.octreeTarget.getGlTexture();
    },

    runInitialPos: function (time) {
      this.initialPosProg.setUniform('time', time);
      this.initialPosProg.setRenderTarget(this.positionTarget);
      this.initialPosProg.draw(0, this.numItems);
    },

    runPopulate: function () {
      this.populateProg.setUniform('positionTexture', this.positionTarget.getGlTexture());
      // this.octreeTarget.texture.applyParameters();
      this.populateProg.draw(0, this.numItems);
    },

    runNbody: function () {
      this.nbodyProg.setUniform('positionTexture', this.positionTarget.getGlTexture());
      this.nbodyProg.setRenderTarget(this.tempTarget);
      this.mipmapTexture.generateMipmap();
      this.mipmapTexture.applyParameters();

      this.nbodyProg.draw(0, this.numItems);
      this.swapTargets('tempTarget', 'positionTarget');
      // this.octreeTarget.texture.applyParameters();
    },

    runVisualization: function () {

    },

    swapTargets: function (a, b) {
      var t = this[a];
      this[a] = this[b];
      this[b] = t;
    },

    setDepth: function (depth) {
      this.depth = depth;
      var size = Math.pow(2, depth);
      var d = Utils.getPotSize(size);
      this.sizeInfo = {
        size: size,
        slicesPerRow: d.w,
        numRows: d.h,
        width: d.w * size,
        height: d.h * size
      }
    }
  };

  Graph.prototype.snapTo = function (x, y, size, lod) {
    var m = Math.pow(2, lod);
    var lsize = size / m;
  }

  Graph.prototype.partition = function (size, lod) {
    // var
    var current = {x: 0.14, y: 0.23, z: 0.87};
    // {
    //   0: []
    //   1:
    //   2:
    //   3:
    //   4:
    // }
    var m = Math.pow(2, lod);
    var lsize = size / m;
    for (var i = 0; i < 1; i+=1/32) {
      var s = Math.floor(i * lsize);
      var s1 = s + 1;
      console.log(i, s * m, s1 * m - 1)
    }
  }


}());
