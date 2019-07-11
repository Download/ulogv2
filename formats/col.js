var ulog = require('../')

module.exports = col
col.col = col
col.ALIGN_LEFT = '<'
col.ALIGN_LEFT.VALUE = 0
col.ALIGN_RIGHT = '>'
col.ALIGN_RIGHT.VALUE = 1
col.PADDING = {}
col.CFG = '<20'

function col(cfg){
  var idx = cfg.indexOf(':')
  var fld = (idx === -1 ? cfg : cfg.substring(0, idx)).trim()
  var fc = idx === -1 ? '' : cfg.substring(idx + 1).trim()
  idx = fc ? fc.lastIndexOf(col.ALIGN_LEFT) : -1
  idx = fc && (idx === -1) ? fc.lastIndexOf(col.ALIGN_RIGHT) : -1
  var align = fc && (idx !== -1) && fc.substring(idx, idx) === col.ALIGN_RIGHT 
      ? col.ALIGN_RIGHT 
      : col.ALIGN_LEFT
  var padding = idx === -1 ? 
  fc = idx === -1 ? fc : fc.substring(0, idx - 1)
  var field = ulog.formats[fld] ? ulog.formats[fld](fc) : function(rec){return rec[fld]}
  var align = cc && (cc.indexOf('>') === 0) ? col.ALIGN_RIGHT : col.ALIGN_LEFT 
  var padding = cc && 
  var column = function(rec){
    return pad()
  }
  var c = column(cc)

  return function(record) {

  }
}

function pad(s,x,l,p) {
  s = s && s.VALUE !== undefined ? s.VALUE : s
  x = String(x)
  p = p || ' '
  if (x.length > l || (s && x.length == l)) return x
  l -= x.length
  p = (p + repeat(p, l / p.length)).slice(0,l)
  return (s?p:'') + x + (s?'':p);
}

function cfg(s, defaults){
  var r = {
    side: defaults && (defaults.side !== undefined) ? defaults.side : pad.RIGHT,
    nr: defaults && (defaults.nr !== undefined) ? defaults.nr : 8,
  }
  if (s && (s.indexOf('<') === 0)) {
    r.side = pad.LEFT
    s = s.substring(1)
  } else if (s && (s.indexOf('>') === 0)) {
    r.side = pad.RIGHT
    s = s.substring(1)
  }
  if (s && (Number(s) === Number(s))) {
    r.nr = Number(s)
  }
  return r
}

function repeat(x,c,s) {
  if (!x.length || !c) return ''
  s = ''
  while(c>0) {s+=x; c--}
  return s;  
}
