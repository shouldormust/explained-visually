'use strict'

var pi = Math.PI
  , abs = Math.abs
  , tau = pi * 2
  , sqrt = Math.sqrt
  , cos = Math.cos
  , sin = Math.sin
  , acos = Math.acos
  , round = Math.round
  , floor = Math.floor
  , max = Math.max
  , min = Math.min
  , random = Math.random

function hyphen(obj) {
  if (obj instanceof String || typeof obj === 'string')
    return hyphenate(obj)
  function hyphenate(str) {
    return str.split('').map(function(c, i) {
      if (i !== 0 && c !== c.toLowerCase()) return '-' + c.toLowerCase()
      return c.toLowerCase()
    }).join('')
  }
  var ret = {}
  Object.keys(obj).map(function(key) {
    ret[hyphenate(key)] = obj[key]
  })
  return ret
}

var zip = function(a, b) {
  return a.map(function(a, i) { return [a, b[i]] })
}

function vec_add(a, b) { return [ a[0] + b[0], a[1] + b[1] ] }

function vector(x, y) {
  var v
  if(Array.isArray(x)) v = {x: x[0], y: x[1]}
  else if (typeof x === 'number') v = {x: x, y: y}
  else if (typeof x === 'object') v = { x: x.x, y: x.y }
  else v = { x: 0, y: 0 }
  // All methods should return a new vector object.
  v.rot = function(theta) {
    var x = v.x * cos(theta) - v.y * sin(theta)
    var y = v.x * sin(theta) + v.y * cos(theta)
    return vector(x, y)
  }
  v.matrixMulti = function(m) {
    return vector(
        m[0][0] * v.x + m[0][1] * v.y
      , m[1][0] * v.x + m[1][1] * v.y
    )
  }
  v.unit = function() { var l = v.len(); return vector(v.x / l, v.y / l) }
  v.len = function() { return sqrt( v.x * v.x + v.y * v.y ) }
  v.sub = function(b) { return vector(v.x - b.x, v.y - b.y) }
  v.add = function(b) { return vector(v.x + b.x, v.y + b.y) }
  v.scale = function(s) { return vector(v.x * s, v.y * s) }
  v.rotDegrees = function(theta) { return v.rot(theta * pi / 180) }
  v.array = function(array) {
    if (array) {
      return vector(array[0], array[1])
    } else {
      return [v.x, v.y]
    }
  }
  v.to = function(func) { return func(v) }
  v.toString = function() { return v.array().toString() }
  return v
}

var matrix = function(m) {
  // Note: Several functions assume a 2 x 2 matrix.
  m = m || [[]]
  m.fromVector = function(v) {
    return matrix([[v.x], [v.y]])
  }
  m.dim = function(rows, cols) {
    if (!arguments.length) return [m.length, m[0].length]
    var a = []
    for(var i = 0; i < rows; i++) {
      var ia = []
      for(var j = 0; j < cols; j++) {
        ia.push(0)
      }
      a.push(ia)
    }
    return matrix(a)
  }
  m.eigenValues = function() {
    var a = m[0][0], b = m[1][0], c = m[0][1], d = m[1][1]
    var e = (a + d) / 2
    var ed = sqrt( e * e + b * c - a * d )
    var e1 = e + ed
    var e2 = e - ed
    return [e1, e2]
  }
  m.eigenVectors = function() {
    var a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1]
    var thres = 1e-16
    var e = m.eigenValues()
    var eVecs = [ [1, 0], [0, 1] ]
    if (c > thres || c < -thres) /* c !== 0 */ {
      eVecs[0] = [ e[0] - d, c ]
      eVecs[1] = [ e[1] - d, c ]
    } else if (b > thres || b < -thres) /* b !== 0 */ {
      eVecs[0] = [ b, e[0] - a ]
      eVecs[1] = [ b, e[1] - a ]
    }
    return eVecs
  }
  m.det = function() {
    var a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1]
    return (a * d - b * c)
  }
  m.inverse = function() {
    var a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1]
    return matrix([
      [d, -b],
      [-c, a]
    ]).scale(1 / m.det())
  }
  m.row = function(i) {
    var l = m.dim()[1] // l => column length
    var a = []
    for(var j = 0; j < l; j++) a.push(m[i][j])
    return a
  }
  m.col = function(j) {
    var l = m.dim()[0] // l => row length
    var a = []
    for(var i = 0; i < l; i++) a.push(m[i][j])
    return a
  }
  m.scale = function(s) {
    var d = m.dim()
    var r = matrix().dim(d[0], d[1]) // Result.
    for(var i = 0; i < d[0]; i++) {
      for(var j = 0; j < d[1]; j++) {
        r[i][j] = m[i][j] * s
      }
    }
    return r
  }
  m.transpose = function() {
    var d = m.dim()
    var r = matrix().dim(d[1], d[0])
    for(var i = 0; i < d[0]; i++) { // rows
      for(var j = 0; j < d[1]; j++) { // columns
        r[j][i] = m[i][j]
      }
    }
    return r
  }
  m.multi = function(b) {
    // create a new nxm matrix
    var r = matrix().dim(m.dim()[0], b.dim()[1])
    var d = r.dim()
    for(var i = 0; i < d[0]; i++)
      for(var j = 0; j < d[1]; j++)
        r[i][j] = array_dot(m.row(i), b.col(j))
    return r
  }
  m.identity = function() {
    var d = m.dim()
    var a = []
    for(var i = 0; i < d[0]; i++) {
      var ia = []
      for(var j = 0; j < d[1]; j++)
        ia.push(i === j ? 1 : 0)
      a.push(ia)
    }
    return matrix(a)
  }
  function array_dot(a, b) {
    var sum = 0
    for(var i = 0; i < a.length; i++) sum += a[i] * b[i]
    return sum
  }
  return m
}



// Explained Visually common components.
var ev = angular.module('ev', [])
ev.directive('evPlayButton', function() {
  function link(scope, el, attr) {
    var s = 20, w, h
    var svg = d3.select(el[0]).select('svg.play-container')
      .style('position', 'absolute')
      .style('top', 0)
      .style('cursor', 'pointer')
      .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var g = svg.append('g')
    var circle = g.append('circle')
      .attr('r', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
    var icon = g.append('path')
      .attr('transform', 'translate(' + [ s/4, 0 ] + ')')
      .attr('d', 'M-' + s + ',-' + s + 'L' + s + ',0L-' + s + ',' + s + 'Z')
      .attr('fill', 'rgba(0, 0, 0, 0.2)')

    function updateDim() {
      return w = el[0].clientWidth, h = el[0].clientHeight, w + h
    }
    scope.$watch(updateDim, resize)

    function resize() {
      svg.attr({width: w, height: h})
      g.attr('transform', 'translate(' + [w / 2, h / 2] + ')')
      scope.myStyle = {
          position: 'absolute'
        , top: '0'
        , left: '0'
        , display: 'block'
        , width: w + 'px'
        , height: h + 'px'
      }
    }
    scope.$watch('isPlaying', function(playing) {
      svg.transition().style('opacity', playing ? 0 : 1)
        .style('pointer-events', playing ? 'none' : 'all')
    })
    svg.on('click', function() {
      scope.$apply(function() { scope.$emit('evPlayBtnClick') })
    })
    updateDim()
    resize()
  }
  return {
      link: link
    , restrict: 'E'
    , scope: { isPlaying: '=' }
    , transclude: true
    , template: '<div ng-style="myStyle">'
      + '<div ng-transclude></div>'
      + '<svg class="play-container"></svg>'
    + '</div>'
  }
})