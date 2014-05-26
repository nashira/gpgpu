/*
Quaternions License:

The MIT License

Copyright &copy; 2010-2014 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var DataBuffer = require('./databuffer');
var ShaderLib = require('./shaderlib');
var fs = require('fs');

var Utils = {};

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
    onLoad(image);
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

Utils.processShader = function (text) {
  var libre = /\$\{([^}]*)\}/g;
  var match;
  while (match = libre.exec(text)) {
    text = text.replace(match[0], ShaderLib[match[1]]);
  }
  return text;
}

Utils.loadShaders = function (urls, onLoad) {
  var libre = /\$\{([^}]*)\}/g;
  var results = urls.map(function () {
    return false;
  });
  urls.forEach(function (url, index) {
    fs.readFile(url, 'utf8', function (error, file) {
      if (error) console.log(error)
      var text = file;

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
    });
  });
}

var Camera = function (fov, aspect, near, far) {
  this.position = [0, 0, -1];
  this.lookAt = [0, 0, 0];
  this.up = [0, 1, 0];
  this.quaternion = new Quaternion();
  this.tmpQuat = new Quaternion();

  this.perspective = [];
  this.world = [];
  this._matrix = [];
  this.v1 = [];
  this.v2 = [];
  this.v3 = [];

  this.setPerspective(fov, aspect, near, far);
}

Camera.prototype = {
  matrix: function () {
    if (this.needsUpdate) {
      this.updateMatrix();
      this.needsUpdate = false;
    }
    return this._matrix;
  },

  setPerspective: function (fov, aspect, near, far) {
    this.perspective = Matrix.makePerspective(fov, aspect, near, far);
    this.needsUpdate = true;
  },

  setPosition: function (x, y, z) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this.needsUpdate = true;
  },

  setLookAt: function (x, y, z) {
    this.lookAt[0] = x;
    this.lookAt[1] = y;
    this.lookAt[2] = z;
    this.needsUpdate = true;
  },

  setUp: function (x, y, z) {
    this.up[0] = x;
    this.up[1] = y;
    this.up[2] = z;
    this.needsUpdate = true;
  },

  zoom: function (z) {
    var a = minus(this.position, this.lookAt, this.v1);
    mults(a, z);
    add(this.lookAt, a, this.position);
    this.needsUpdate = true;
  },

  orbit: function (x, y) {
    var a = this.v1;
    a[0] = x;
    a[1] = y;
    a[2] = 0;
    this.quaternion.rotVec(a);
    this.tmpQuat.fromEuler(a[0], a[1], a[2]);
    minus(this.position, this.lookAt, a);
    this.tmpQuat.rotVec(a);
    add(this.lookAt, a, this.position);
    this.tmpQuat.rotVec(this.up);

    this.tmpQuat.fromEuler(x, y, 0);
    this.quaternion.multiply(this.tmpQuat);
    this.needsUpdate = true;
  },

  updateMatrix: function () {
    var eye = this.position;
    var at = this.lookAt;
    var up = this.up;

    var zaxis = norm(minus(eye, at, this.v1));
    var xaxis = norm(cross(up, zaxis, this.v2));
    var yaxis = cross(zaxis, xaxis, this.v3);

    this.world[0] = xaxis[0]; this.world[1] = yaxis[0];
    this.world[2] = zaxis[0]; this.world[3] = 0;
    this.world[4] = xaxis[1]; this.world[5] = yaxis[1];
    this.world[6] = zaxis[1]; this.world[7] = 0;
    this.world[8] = xaxis[2]; this.world[9] = yaxis[2];
    this.world[10] = zaxis[2]; this.world[11] = 0;
    this.world[12] = -dot(xaxis, eye); this.world[13] = -dot(yaxis, eye);
    this.world[14] = -dot(zaxis, eye); this.world[15] = 1;
    Matrix.multiplyMatrix(this.world, this.perspective, this._matrix);
  }
};

var Quaternion = function (x, y, z, w) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

Quaternion.prototype = {
  fromAngle: function (x, y, z, angle) {
    var halfAngle = angle / 2, s = Math.sin(halfAngle);

    this.x = x * s;
    this.y = y * s;
    this.z = z * s;
    this.w = Math.cos(halfAngle);
  },

  fromEuler: function (x, y, z) {
    var c1 = Math.cos(x / 2);
    var c2 = Math.cos(y / 2);
    var c3 = Math.cos(z / 2);
    var s1 = Math.sin(x / 2);
    var s2 = Math.sin(y / 2);
    var s3 = Math.sin(z / 2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
  },

  length: function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  },

  normalize: function () {
    var l = this.length();
    if (l == 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;
      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }
  },

  multiply: function (b) {
    var a = this;
    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
  },

  rotVec: function (v) {
    var x = v[0];
    var y = v[1];
    var z = v[2];

    var qx = this.x;
    var qy = this.y;
    var qz = this.z;
    var qw = this.w;

    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = -qx * x - qy * y - qz * z;

    v[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    v[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    v[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  },

  invert: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    this.normalize();
    return this;
  }
};


function norm(a, r) {
  r = r || a;
  var sqrt = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
  r[0] = a[0]/sqrt;
  r[1] = a[1]/sqrt;
  r[2] = a[2]/sqrt;
  return r;
}

function minus(a, b, r) {
  r[0] = a[0] - b[0];
  r[1] = a[1] - b[1];
  r[2] = a[2] - b[2];
  return r;
}

function add(a, b, r) {
  r[0] = a[0] + b[0];
  r[1] = a[1] + b[1];
  r[2] = a[2] + b[2];
  return r;
}

function mults(a, s) {
  a[0] = a[0] * s;
  a[1] = a[1] * s;
  a[2] = a[2] * s;
  return a;
}

function cross(a, b, r) {
  r[0] = a[1] * b[2] - a[2] * b[1];
  r[1] = a[2] * b[0] - a[0] * b[2];
  r[2] = a[0] * b[1] - a[1] * b[0];
  return r;
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

var Matrix = {
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

module.exports = {
  Utils: Utils,
  Matrix: Matrix,
  Camera: Camera
}
