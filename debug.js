var ulog = require('./')
ulog.formats.column = require('./formats/column')
ulog.formats.name = require('./formats/name')
ulog.formats.level  = require('./formats/level')
ulog.formats.time = require('./formats/time')
ulog.formats.perf = require('./formats/perf')
ulog.formats.host = require('./formats/host')
ulog.formats.pid = require('./formats/pid')
ulog.formats.cid = require('./formats/cid')


var columns = ulog.formats.columns = require('./formats/columns')

out.fields.time = require('./formats/columns/time')
out.fields.diff = require('./formats/columns/fields/diff')
out.fields.name = require('./formats/columns/name')
out.fields.level = require('./formats/columns/fields/level')

var DEFAULT_CFG = 'time diff name:>24 msg'

module.exports = function debug(cfg){
  if (!cfg) cfg = 'time diff name:>24 msg'
  return format(cfg)
}

function format(cfg) {
  if (!cfg) cfg = 'time diff name:>24 msg'
  var cfgs = cfg.split(/[\s,]+/).filter(function(x){return x})
  var serializers = cfgs.map(toSerializer)

  return function(rec) {
    var args = []
    for (var i=0,serialize; serialize=serializers[i]; i++) {
      args.push(serialize(rec))
    }
    rec.args = args
  }
}

function toSerializer(str) {
  var idx = str.indexOf(':')
  var cfg = idx === -1 ? '' : str.substring(idx + 1).trim()
  var name = (idx === -1 ? str : str.substring(0, idx)).trim()
  return debug.serializers[name] ? debug.serializers[name](cfg) : function(rec){return rec[name]}
}

debug.serializers = {
  time: function(cfg){
    return function(rec){
      var d = new Date(rec.time)
      return [
        pad(LEFT, d.getHours(), 2, '0'),
        pad(LEFT, d.getMinutes(), 2, '0'),
        pad(LEFT, d.getSeconds(), 2, '0')
      ].join(':')
    }
  },

  diff: function(cfg) {
    var prev
    var pc = padCfg(cfg, { side: LEFT, nr: 5 })

    return function(rec) {
      var p = prev && prev.t || rec.time
      format.prev = { t: rec.time }
      rec.diff = new Date(rec.time - p).getTime()
      var d = new Date(rec.diff),
          days = d.getUTCDate() - 1, 
          h = d.getUTCHours(), 
          m = d.getUTCMinutes(), 
          s = d.getUTCSeconds(),
          f = Math.floor,
          ms = (t - p - s*1000)
      return pad(pc.side, (
        t - p < 1000 ? (t - p > 10 ? '.' + pad(LEFT, f((t-p)/10), 2, '0') : '') : // ms
          days ? days + 'd' + pad(LEFT, h, 2, '0') :
          h ? h + 'h' + pad(LEFT, m, 2, '0') :  
          m ? m + 'm' + pad(LEFT, s, 2, '0') :  
          s ? s + '.' + pad(LEFT, f(ms/10), 2, '0') : 
        ''
      ), pc.nr)
    }
  },
  
  name: function(cfg){
    var pc = padCfg(cfg, { side: RIGHT, nr: 24 })

    return function(rec) {
      return pad(pc.side, rec.name.substring(0, pc.nr), pc.nr)
    }
  }
}


var LEFT=1, 
    RIGHT=0

function padCfg(s, defaults){
  var r = {
    side: defaults && (defaults.side !== undefined) ? defaults.side : RIGHT,
    nr: defaults && (defaults.nr !== undefined) ? defaults.nr : 8,
  }
  if (s && (s.indexOf('<') === 0)) {
    r.side = LEFT
    s = s.substring(1)
  } else if (s && (s.indexOf('>') === 0)) {
    r.side = RIGHT
    s = s.substring(1)
  }
  if (s && (Number(s) === Number(s))) {
    r.nr = Number(s)
  }
  return r
}
    
    
function pad(s,x,l,p) {
  x = String(x)
  p = p || ' '
  if (x.length > l || (s && x.length == l)) return x
  l -= x.length
  p = (p + repeat(p, l / p.length)).slice(0,l)
  return (s?p:'') + x + (s?'':p);
}

function repeat(x,c,s) {
  if (!x.length || !c) return ''
  s = ''
  while(c>0) {s+=x; c--}
  return s;  
}
