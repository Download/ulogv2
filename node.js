// ulog - the universal logger
// © 2019 by Stijn de Witt, some rights reserved
// License: CC-BY-4.0
var a = module.exports = require('./core')

a.env = {
  get: n => process.env[name(n)],
  set: (n,v) => process.env[name(n)] = v
}

a.add('mods', {
  options: require('./options'),
  levels: require('./levels'),
  assert: require('./assert'),
  outputs: require('./outputs/node'),
  // formats: require('./formats'),
})

// convert option name to platform style
function name(n){
  return n == 'level' ? 'LOG' : (n == 'debug' ? 'DEBUG' : 'LOG_' + n.toUpperCase())
}
