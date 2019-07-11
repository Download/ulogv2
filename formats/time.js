var pad = require('./col')

module.exports = function time(cfg) {
  var parts = (cfg || '').split(':').map(function(x){
    return (
      x.indexOf('h') === 0 ? function(d){return pad(pad.LEFT, d.getHours(), x == 'hh' ? 2 : 1, '0')} :
      x.indexOf('m') === 0 ? function(d){return pad(pad.LEFT, d.getMinutes(), x == 'mm' ? 2 : 1, '0')} :
      x.indexOf('s') === 0 ? function(d){return pad(pad.LEFT, d.getSeconds(), x == 'ss' ? 2 : 1, '0')} : d
    )
  })
  
  return function(rec){
    rec.time = rec.time || new Date().getTime()
    var d = new Date(rec.time)
    return parts.map(function(part){
      return part(d)
    }).join(':')
  }
}