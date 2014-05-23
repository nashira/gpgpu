
// var Program = require('../webgl/program');
// var Matrix = require('../webgl/utils').Matrix;
// var Graph = require('./graph');
// var esprima = require('esprima');
// var $ = require('atom').$;
// var dat = require('./dat.gui.min');
var GraphView;
(function () {
  var Colors = {
      AssignmentExpression: [100.0, 4.0, 4.0],
      ArrayExpression: [92.0, 12.0, 12.0],
      BlockStatement: [84.0, 20.0, 20.0],
      BinaryExpression: [100.0, 33.0, 4.0],
      BreakStatement: [94.0, 38.0, 11.0],
      CallExpression: [86.0, 40.0, 18.0],
      CatchClause: [100.0, 59.0, 4.0],
      ConditionalExpression: [95.0, 61.0, 9.0],
      ContinueStatement: [87.0, 62.0, 17.0],
      DebuggerStatement: [100.0, 93.0, 4.0],
      DirectiveStatement: [13.0, 91.0, 66.0],
      DoWhileStatement: [4.0, 100.0, 62.0],
      EmptyStatement: [22.0, 82.0, 43.0],
      ExpressionStatement: [13.0, 92.0, 46.0],
      ForStatement: [4.0, 100.0, 35.0],
      ForInStatement: [24.0, 89.0, 15.0],
      FunctionDeclaration: [14.0, 100.0, 4.0],
      FunctionExpression: [58.0, 92.0, 12.0],
      Identifier: [59.0, 100.0, 4.0],
      IfStatement: [89.0, 91.0, 13.0],
      Literal: [20.0, 84.0, 81.0],
      LabeledStatement: [35.0, 77.0, 81.0],
      LogicalExpression: [34.0, 65.0, 82.0],
      MemberExpression: [17.0, 65.0, 100.0],
      NewExpression: [29.0, 36.0, 88.0],
      ObjectExpression: [0.0, 7.0, 99.0],
      Program: [27.0, 0.0, 99.0],
      Property: [38.0, 9.0, 89.0],
      ReturnStatement: [45.0, 20.0, 74.0],
      SequenceExpression: [66.0, 0.0, 94.0],
      SwitchStatement: [87.0, 22.0, 49.0],
      SwitchCase: [100.0, 16.0, 62.0],
      ThisExpression: [100.0, 16.0, 94.0],
      ThrowStatement: [87.0, 15.0, 85.0],
      TryStatement: [77.0, 25.0, 77.0],
      UnaryExpression: [69.0, 38.0, 76.0],
      UpdateExpression: [71.0, 8.0, 86.0],
      VariableDeclaration: [100.0, 52.0, 52.0],
      VariableDeclarator: [98.0, 100.0, 68.0],
      WhileStatement: [91.0, 65.0, 97.0],
      WithStatement: [89.0, 91.0, 90.0]
  };

  function buildTree(src) {
    var tree = esprima.parse(src);
    console.log(tree)
    var vertexId = 0;
    var colorStack = [[100, 100, 100]];
    var stack = [0];
    var edges = [];
    var colors = [];
    traverse(tree, {
      enter: function (obj) {
        var id = ++vertexId;
        if (obj.type in Colors) {
          colorStack.push(Colors[obj.type]);
        }
        var clr = colorStack[colorStack.length - 1];
        colors.push(clr[0]/100, clr[1]/100, clr[2]/100);
        edges.push(stack[stack.length - 1], id);
        stack.push(id);
      },
      exit: function (obj) {
        stack.pop();
        if (obj.type in Colors) {
          colorStack.pop();
        }
      }
    });
    return [vertexId, edges, colors];
  }

  // Executes visitor on the object and its children (recursively).
  function traverse(object, visitor) {
      var key, child;

      if (visitor.enter.call(null, object) === false) {
          return;
      }
      for (key in object) {
          if (object.hasOwnProperty(key)) {
              child = object[key];
              if (typeof child === 'object' && child !== null) {
                  traverse(child, visitor);
              }
          }
      }
      if (visitor.exit.call(null, object) === false) {
          return;
      }
  }

  GraphView = function () {
    this.params = {
      renderEdges: true,
      renderVertices: true,
      edgeForces: true,
      vertexForces: true
    };
  }

  GraphView.prototype.init = function (source) {
    var canvas = document.getElementsByTagName('canvas')[0];
    var width = window.innerWidth;
    var height = window.innerHeight;
    console.log(canvas)
    var devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = canvas.style.height = '100%'
    if (!this.graph) {
      this.graph = new Graph();

      var gui = new dat.GUI();
      gui.add(this.graph, 'vDt', 0, 10);
      gui.add(this.graph, 'eDt', 0, 1);
      gui.add(this.graph, 'pointSize', 0, 20);
      gui.add(this.params, 'vertexForces');
      gui.add(this.params, 'edgeForces');
      gui.add(this.params, 'renderEdges');
      gui.add(this.params, 'renderVertices');

      var start = {}, moving = false, self = this;
      canvas.addEventListener('mousedown', function (e) {
        moving = true;
        start.x = e.x;
        start.y = e.y;
        console.log(start)
      }, false);
      canvas.addEventListener('mouseup', function () {
        moving = false;
      }, false);
      canvas.addEventListener('mousemove', function (e) {
        if (!moving) return;

        var dx = e.x - start.x;
        var dy = e.y - start.y;
        start.x = e.x;
        start.y = e.y;

        // console.log(dx, dy)
        self.camera.orbit(dy * 0.01, dx * -0.01);

      }, false);
      canvas.addEventListener('wheel', function (e) {
        var scale = 1 + e.deltaY * 0.01;
        self.camera.zoom(scale);
      }, false);
    }

    var gl = canvas.getContext('webgl');
    console.log(gl);
    Program.init(gl);
    Graph.init(gl);


    // var editor = atom.workspace.getActiveEditor();
    // var source = editor.getText();
    var data = buildTree(source);

    console.log(data)

    var ww = width * 2
    var wh = height * 2
    this.graph.load({
      numVertices: data[0],
      numEdges: data[1].length / 2,
      edges: data[1],
      vertexColors: data[2]
    }, 1.5, function () {
      this.graph.drawVerticesProg.setViewport(0, 0, ww, wh);
      this.graph.drawEdgesProg.setViewport(0, 0, ww, wh);
      this.graph.runInitialPos(0.1);
      this.animate();
    }.bind(this));
  }

  GraphView.prototype.animate = function () {
    var angle = 0
    var camera = this.camera = new Camera(0.6, window.innerWidth / window.innerHeight, 1, 10000);
    camera.setPosition(0, 0, -300);
    camera._lookAt();
    camera.updateMatrix();

    var ani = function () {
      // Matrix.setYRotation(rm, angle += 0.0005);
      // Matrix.multiply(m, rm, tm, pm);

      if (this.params.edgeForces)
        this.graph.runEdges();

      if (this.params.vertexForces)
        this.graph.runNbody();

      if (this.params.renderVertices)
        this.graph.drawVertices(camera.matrix);

      if (this.params.renderEdges)
        this.graph.drawEdges(camera.matrix);

      if (!this.stopped) {
        window.requestAnimationFrame(ani);
      }
    }.bind(this);

    ani();
  }

}());
