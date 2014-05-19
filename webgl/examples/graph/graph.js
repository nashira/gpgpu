var Graph;

(function () {
  Graph = function (data, downsample, onLoad) {
    this.numVertices = data.numVertices;
    this.numEdges = data.numEdges;
    this.downsample =
        Math.floor(numVertices * ((downsample || 0) * 0.00015)) + 1;
    this.downsampleIdx = 0;
    this.itemTS = Utils.getPotSize(numVertices);
    this.vertCoords = Utils.getTextureIndecies(
      this.itemTS.w, this.itemTS.h, this.numVertices, true);

    this.vertices = {};
    this.edges = [];
    var data = this.vertCoords.data;

    for (var i = 0; i < this.numEdges; i++) {
      var a = Math.floor(Math.random() * this.numVertices);
      var b = Math.floor(Math.random() * this.numVertices);
      this.edges.push(data[a*2], data[a*2+1], data[b*2], data[b*2+1]);
    }

    this.vDt = 0.0001;
    this.eDt = 0.01;

    this.init(onLoad);
  }

  Graph.prototype = {
    init: function (onLoad) {
      Utils.loadShaders([
        './initial_posv.glsl',
        './initial_posf.glsl',
        './nbodyv.glsl',
        './nbodyf.glsl',
        './edge_forcev.glsl',
        './edge_forcef.glsl',
        './visualizev.glsl',
        './visualizef.glsl'], function (shaders) {

          var sid = 0;
          this.initInitialPos(shaders[sid++], shaders[sid++]);
          this.initNbody(shaders[sid++], shaders[sid++]);
          this.initEdges(shaders[sid++], shaders[sid++]);
          this.initVisualize(shaders[sid++], shaders[sid++]);

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
      this.forceTarget = new RenderTarget(size.w, size.h, {type: gl.FLOAT});
      this.tempTarget = new RenderTarget(size.w, size.h, {type: gl.FLOAT});
    },

    initNbody: function (vert, frag) {
      var ymax = Math.ceil(this.numVertices / this.itemTS.w) / this.itemTS.h;
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
      this.nbodyProg.addUniform('forceTexture', 't');

      this.nbodyProg.addUniform('xstart', 'f', 0);
      this.nbodyProg.addUniform('ystart', 'f', 0);
      this.nbodyProg.addUniform('dt', 'f', this.vDt * this.downsample);
      this.nbodyProg.setViewport(0, 0, this.itemTS.w, this.itemTS.h);
    },

    initEdges: function (vert, frag) {
      this.edgeProg = new Program(vert, frag, {
        drawMode: gl.POINTS,
        blendEnabled: true,
        // blendFunc: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA],
        depthTest: false
      });
      this.edgeCoords = new DataBuffer(4, this.numEdges, new Float32Array(this.edges));

      this.edgeProg.addAttribute('coords', 4, gl.FLOAT, this.edgeCoords);
      this.edgeProg.addUniform('positionTexture', 't');
      this.edgeProg.addUniform('dt', 'f', this.eDt);
      this.edgeProg.addUniform('forceDir', 'f', 0);
      this.edgeProg.setViewport(0, 0, this.itemTS.w, this.itemTS.h);
      this.edgeProg.setRenderTarget(this.forceTarget);
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
      this.initialPosProg.draw(0, this.numVertices);
      this.swapTargets();
    },

    runNbody: function () {
      this.nbodyProg.setUniform('positionTexture',
          this.positionTarget.getGlTexture());
      this.nbodyProg.setUniform('previousTexture',
          this.previousTarget.getGlTexture());
      this.nbodyProg.setUniform('forceTexture',
          this.forceTarget.getGlTexture());
      this.nbodyProg.setUniform('dt', this.vDt);
      this.nbodyProg.setUniform('xstart', this.downsampleIdx / this.itemTS.w);
      this.nbodyProg.setUniform('ystart', this.downsampleIdx / this.itemTS.h);
      this.nbodyProg.setRenderTarget(this.tempTarget);

      this.nbodyProg.draw(0, this.numVertices);
      this.swapTargets();
      this.downsampleIdx = (this.downsampleIdx + 1) % this.downsample;
    },

    runEdges: function () {
      this.edgeProg.setUniform('positionTexture',
          this.positionTarget.getGlTexture());
      this.edgeProg.setUniform('forceDir', 0);
      this.edgeProg.setUniform('dt', this.eDt);

      this.edgeProg.clear = gl.COLOR_BUFFER_BIT;
      // console.log(this.edgeProg.clear)
      this.edgeProg.draw(0, this.numEdges);

      this.edgeProg.setUniform('forceDir', 1);

      this.edgeProg.clear = false;
      this.edgeProg.draw(0, this.numEdges);
    },

    runVisualize: function (matrix) {
      this.visualizeProg.clear = (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.visualizeProg.drawMode = gl.POINTS;
      this.visualizeProg.setUniform('positionTexture',
          this.positionTarget.getGlTexture());
      this.visualizeProg.setUniform('matrix', matrix);
      this.visualizeProg.setAttribute('coords', this.vertCoords);
      this.visualizeProg.draw(0, this.numVertices);

      this.visualizeProg.clear = false;
      this.visualizeProg.drawMode = gl.LINES;
      this.visualizeProg.setAttribute('coords', this.edgeCoords);
      this.visualizeProg.draw(0, this.numEdges * 2);
    },

    swapTargets: function () {
      var t = this.previousTarget;
      this.previousTarget = this.positionTarget;
      this.positionTarget = this.tempTarget;
      this.tempTarget = t;
    }
  };
}());
