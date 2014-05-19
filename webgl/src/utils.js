var Utils, Matrix;

(function () {
  Utils = {};

  Utils.getTextureIndecies = function (width, height, limit, keepData) {
    limit = limit || (width * height);
    var data = [];
    var dw = 1 / width;
    var dh = 1 / height;
    for (var i = dh * 0.5; i < 1; i += dh) {
      for (var j = dw * 0.5; j < 1; j += dw) {
        data.push(j, i);
        if (data.length / 2 >= limit) {
          break;
        }
      }
      if (data.length / 2 >= limit) {
        break;
      }
    }
    // console.log('getTextureIndecies', data);
    var db = new DataBuffer(2, limit, new Float32Array(data));
    if (keepData) db.data = data;
    return db;
  }

  Utils.getPotSize = function (num) {
    var w = 1, h = 1;

    while (w * h < num) {
      w *= 2;
      if (w * h >= num) break;
      h *= 2;
    }

    return {w: w, h: h};
  }

  Utils.loadImage = function (url, onLoad) {
    var image = new Image();
    image.onload = function () {
      onLoad(cubeImage);
    };
    image.src = url;
  }

  Utils.loadFile = function (url, onLoad) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        if (onLoad) {
          onLoad(xhr);
        }
      }
    }
    xhr.open('GET', url, true);
    xhr.send();
  }

  Utils.loadShaders = function (urls, onLoad) {

    var results = urls.map(function () {
      return false;
    });

    urls.forEach(function (url, index) {
      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          var text = xhr.responseText;
          var libre = /\$\{([^}]*)\}/g;
          var match;
          while (match = libre.exec(text)) {
            text = text.replace(match[0], ShaderLib[match[1]]);
          }

          results[index] = text;

          if (onLoad && results.every(function (r) {
            return r;
          })) {
            onLoad(results);
          }
        }
      }

      xhr.open('GET', url, true);
      xhr.send();
    });

    // function finish() {
    //   results.forEach(function (r) {
    //
    //   })
    // }
  }

  Matrix = {

    normal: function (arr) {
      var sqrt = Math.sqrt(arr[0]*arr[0]+arr[1]*arr[1]+arr[2]*arr[2]);
      return [arr[0]/sqrt, arr[1]/sqrt, arr[2]/sqrt];
    },

    minus: function (a, b) {
      return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
    },

    dot: function (a, b) {
      return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    },

    cross: function (a, b) {
      return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    },

    makeLookAt: function (eye, at, up) {
      var zaxis = Matrix.normal(Matrix.minus(eye, at));
      var xaxis = Matrix.normal(Matrix.cross(up, zaxis));
      var yaxis = Matrix.cross(zaxis, xaxis);

       return [xaxis[0], yaxis[0], zaxis[0], 0,
               xaxis[1], yaxis[1], zaxis[1], 0,
               xaxis[2], yaxis[2], zaxis[2], 0,
              -Matrix.dot(xaxis, eye), -Matrix.dot(yaxis, eye), -Matrix.dot(zaxis, eye), 1];
    },

    // taken from html5rocks.com
    makePerspective: function(fieldOfViewInRadians, aspect, near, far) {
      var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
      var rangeInv = 1.0 / (near - far);

      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
      ];
    },

    makeOrthographic: function (width, height, depth) {
      // Note: This matrix flips the Y axis so 0 is at the top.
      return [
         2 / width, 0, 0, 0,
         0, -2 / height, 0, 0,
         0, 0, 2 / depth, 0,
        -1, 1, 0, 1,
      ];
    },

    makeTranslation: function (tx, ty, tz) {
      return [
         1,  0,  0,  0,
         0,  1,  0,  0,
         0,  0,  1,  0,
        tx, ty, tz,  1
      ];
    },

    setTranslation: function (m, tx, ty, tz) {
      m[12] = tx;
      m[13] = ty;
      m[14] = tz;
    },

    makeXRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);

      return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
      ];
    },

    setXRotation: function(m, angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      m[5] = c;
      m[6] = s;
      m[9] = -s;
      m[10] = c;
    },

    makeYRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);

      return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
      ];
    },

    setYRotation: function(m, angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      m[0] = c;
      m[2] = -s;
      m[8] = s;
      m[10] = c;
    },

    makeZRotation: function(angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      return [
         c, s, 0, 0,
        -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1,
      ];
    },

    setZRotation: function(m, angleInRadians) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      m[0] = c;
      m[1] = s;
      m[4] = -s;
      m[5] = c;
    },

    makeScale: function(sx, sy, sz) {
      return [
        sx, 0,  0,  0,
        0, sy,  0,  0,
        0,  0, sz,  0,
        0,  0,  0,  1,
      ];
    },

    setScale: function(m, sx, sy, sz) {
      m[0] = sx;
      m[5] = sy;
      m[10] = sz;
    },

    multiply: function () {
      var m = arguments[1], t = arguments[0];
      for (var i = 1; i < arguments.length; i++) {
        Matrix.multiplyMatrix(m, arguments[i], t);
        m = t;
      }
      return m;
    },

    multiplyMatrix: function(a, b, c) {
      c = c || [];
      var a00 = a[0];
      var a01 = a[1];
      var a02 = a[2];
      var a03 = a[3];
      var a10 = a[4];
      var a11 = a[5];
      var a12 = a[6];
      var a13 = a[7];
      var a20 = a[8];
      var a21 = a[9];
      var a22 = a[10];
      var a23 = a[11];
      var a30 = a[12];
      var a31 = a[13];
      var a32 = a[14];
      var a33 = a[15];
      var b00 = b[0];
      var b01 = b[1];
      var b02 = b[2];
      var b03 = b[3];
      var b10 = b[4];
      var b11 = b[5];
      var b12 = b[6];
      var b13 = b[7];
      var b20 = b[8];
      var b21 = b[9];
      var b22 = b[10];
      var b23 = b[11];
      var b30 = b[12];
      var b31 = b[13];
      var b32 = b[14];
      var b33 = b[15];
      c[0]  = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
      c[1]  = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
      c[2]  = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
      c[3]  = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
      c[4]  = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
      c[5]  = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
      c[6]  = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
      c[7]  = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
      c[8]  = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
      c[9]  = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
      c[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
      c[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
      c[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
      c[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
      c[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
      c[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
      return c;
    }
  }
}());
