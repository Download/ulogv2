// ulog - the universal logger
// © 2019 by Stijn de Witt, some rights reserved
// License: CC-BY-4.0
var ulog = module.exports = require('./core')
ulog.add('mods', {
	env: require('./env/browser'),
	levels: require('./levels'),
	outputs: require('./outputs'),
	formats: require('./formats'),
})
