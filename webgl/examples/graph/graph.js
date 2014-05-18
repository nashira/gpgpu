var Graph;

(function () {
  Graph = function (numItems, downsample, onLoad) {
    this.numItems = numItems;
    this.downsample =
        Math.floor(numItems * ((downsample || 0) * 0.00015)) + 1;
    this.downsampleIdx = 0;
    this.itemTS = Utils.getPotSize(numVertices);
    this.vertCoords = Utils.getTextureIndecies(
      this.itemTS.w, this.itemTS.h, this.numItems);

    this.init(onLoad);
  }

  Graph.prototype = {
    init: function (onLoad) {
      Utils.loadShaders([
        './initial_posv.glsl',
        './initial_posf.glsl',
        './nbodyv.glsl',
        './nbodyf.glsl',
        './visualizev.glsl',
        './visualizef.glsl'], function (shaders) {

          this.initInitialPos(shaders[0], shaders[1]);
          this.initNbody(shaders[2], shaders[3]);
          this.initVisualize(shaders[4], shaders[5]);

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
      this.initialPosProg.setViewport(0, 0, this.itemTS.w, this.itemTS.h);
      this.positionTarget = new RenderTarget(size.w, size.h, {type: gl.FLOAT});
      this.previousTarget = new RenderTarget(size.w, size.h, {type: gl.FLOAT});
      this.tempTarget = new RenderTarget(size.w, size.h, {type: gl.FLOAT});
    },

    initNbody: function (vert, frag) {
      var ymax = Math.ceil(this.numItems / this.itemTS.w) / this.itemTS.h;
      vert = vert.replace(/\#\{xsize\}/, this.downsample / this.itemTS.w);
      vert = vert.replace(/\#\{ysize\}/, this.downsample / this.itemTS.h);
      vert = vert.replace(/\#\{ymax\}/, ymax.toPrecision(15));
      vert = vert.replace(/\#\{xiter\}/, 0.5 / this.itemTS.w);
      vert = vert.replace(/\#\{yiter\}/, 0.5 / this.itemTS.h);
      // console.log(vert)
      this.nbodyProg = new Program(vert, frag, {
        drawMode: gl.POINTS
      });

      this.nbodyProg.addAttribute('coords', 2, gl.FLOAT, this.vertCoords);
      this.nbodyProg.addUniform('positionTexture', 't');
      this.nbodyProg.addUniform('previousTexture', 't');

      this.nbodyProg.addUniform('xstart', 'f', 0);
      this.nbodyProg.addUniform('ystart', 'f', 0);
      this.nbodyProg.addUniform('dt', 'f', 0.00000001 * this.downsample);
      this.nbodyProg.setViewport(0, 0, this.itemTS.w, this.itemTS.h);
    },

    initVisualize: function (vert, frag) {
      var size = this.itemTS;
      this.visualizeProg = new Program(vert, frag, {
          drawMode: gl.POINTS,
          blendEnabled: true,
          depthTest: false
        });
      this.visualizeProg.addUniform('positionTexture', 't');
      this.visualizeProg.addUniform('matrix', 'm4');
      this.visualizeProg.addAttribute('coords', 2, gl.FLOAT, this.vertCoords);
    },

    runInitialPos: function (time) {
      this.initialPosProg.setUniform('time', time);
      this.initialPosProg.setRenderTarget(this.tempTarget);
      this.initialPosProg.draw(0, this.numItems);
      this.swapTargets();
    },

    runNbody: function () {
      this.nbodyProg.setUniform('positionTexture',
          this.positionTarget.getGlTexture());
      this.nbodyProg.setUniform('previousTexture',
          this.previousTarget.getGlTexture());
      this.nbodyProg.setUniform('xstart', this.downsampleIdx / this.itemTS.w);
      this.nbodyProg.setUniform('ystart', this.downsampleIdx / this.itemTS.h);
      this.nbodyProg.setRenderTarget(this.tempTarget);

      this.nbodyProg.draw(0, this.numItems);
      this.swapTargets();
      this.downsampleIdx = (this.downsampleIdx + 1) % this.downsample;
    },

    runVisualize: function (matrix) {
      this.visualizeProg.setUniform('positionTexture',
          this.positionTarget.getGlTexture());
      this.visualizeProg.setUniform('matrix', matrix);
      this.visualizeProg.draw(0, this.numItems);
    },

    swapTargets: function () {
      var t = this.previousTarget;
      this.previousTarget = this.positionTarget;
      this.positionTarget = this.tempTarget;
      this.tempTarget = t;
    }
  };
}());
