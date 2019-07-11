// ulog - the universal logger
// © 2019 by Stijn de Witt, some rights reserved
// License: CC-BY-4.0
var a = module.exports = require('./core')

a.env = {
	get: function(n){try {return localStorage.getItem(name(n))}catch(e){/* ignore */}},
	set: function(n,v){try {v===undefined ? localStorage.removeItem(name(n)) : localStorage.setItem(name(n),v)}catch(e){/* ignore */}}
}

a.add('mods', {
	options: require('./options'),
  levels: require('./levels'),
  assert: require('./assert'),
  // outputs: require('./outputs'),
  // formats: require('./formats'),
})

// convert option name to platform style
function name(n){
  return n == 'level' ? 'log' : (n == 'debug' ? 'debug' : 'log_' + n)
}
