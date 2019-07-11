var pad = require('./col')

module.exports = columns
columns.SEP = /[\s,]+/
// ulog_format = out(time:hh:mm:ss<12 perf name>24)
columns.CFG = 'msg'

function columns(cfg) {
  if (!cfg) cfg = columns.CFG

  var cols = cfg
  .split(columns.SEP)
  .reduce(toColumn, [])

  var fields = Object.keys(columns.fields).reduce(function(r, name){
    r[name] = fieldByName(name)
  })
  var emitters = cols.map(emitter).filter(notEmpty)

  function configureFields(fields, cfg)
  function fieldByName(name) {
    return (columns.fields[name] ? 
      columns.fields[name](cfg) : 
      function(rec) {return rec[name]}
    )
  }
  
  
  function format(l, v, args) {
    var rec = { logger: l, level: v, msg: args }
    rec.msg = cols.reduce(function(results, col) {
      results.push.apply(results, col(rec))
    })
    rec.msg = results
  }
  
  format.emit = function(rec) {
    emitters.forEach(function(emitter){
      emitter(rec)
    })
  }
  
  return {
    return 
  }


}

function emitter(col){
  return col.emit
}

function name(cfg) {
  return function(rec) {
    return rec.name
  }
}

function level(cfg) {
  return function(rec) {
    return (                 
      rec.level == 'error' ? 'x' : // ✖
      rec.level == 'warn'  ? '!' : // ⚠
      rec.level == 'info'  ? 'i' : // 🛈
      rec.level == 'log'   ? '•' : // ⨂
      rec.level == 'debug' ? '>' : // ▷
      rec.level == 'trace' ? '≥' : // ▶
      ' '
    )
  }
}

function toColumn(s,x) {
  if (typeof s == 'string') {
    var idx = str.indexOf(':')
    var fld = (idx === -1 ? str : str.substring(0, idx)).trim()
    var fc = idx === -1 ? '' : str.substring(idx + 1).trim()
    idx = fc ? fc.lastIndexOf('<') : -1
    idx = fc && (idx === -1) ? fc.lastIndexOf('>') : -1
    var cc = idx === -1 ? '' : fc.substring(idx)
    fc = idx === -1 ? fc : fc.substring(0, idx - 1)
    var f = field(fld, fc)
    var c = column(cc)
    return padded(cfg, field(fld, cfg))
  }
}

/**
 * Parses a column configuration string.
 * 
 * @param {String} str The config string
 */
function columnConfig(str) {
  str = str || ''
  var idx = str.indexOf(':')
  var al = str.lastIndexOf('<')
  var wd = al != -1 ? Nstr.substring(al + 1)
  wd = Number(wd) !== Number(wd) ? null : Number
  var ar = str.lastIndexOf('>')
  if (al !== -1)
  var cfg = idx === -1 ? '' : str.substring(idx + 1).trim()
  var name = (idx === -1 ? str : str.substring(0, idx)).trim()
  var col, sep = cfg.lastIndexOf('<')
  if (sep === -1) sep = cfg.lastIndexOf('>')
  if (sep !== -1) {
    col = cfg.substring(sep)
    cfg = cfg.substring(0, sep)
  }
}

function notEmpty(x){
  return !!x
}


function column(cfg, field) {

  return function(rec){
    return pad(pc.side, field(rec), pc.nr)
  }
}

column.cfg = function(s){
  return s && s.indexOf && ((s.indexOf('<') === 0) || (s.indexOf('>')=== 0))
}


function field(name, cfg) {
  var fn = out.fields[name] ? out.fields[name](cfg) : function(rec) {
    return rec[name]
  }

  var pc = cfg.split(out.SEP).filter(isColumnCfg)[0] || {side:pad.RIGHT, nr:8}

  return function(rec) {
    return pad(pc.side, fn(rec), pc.nr
}

