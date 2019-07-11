// ulog - the universal logger
// © 2019 by Stijn de Witt, some rights reserved. License: CC-BY-4.0
// Permission to remove these comments in production builds hereby granted

// import anylogger as ulog supports it natively
var a = module.exports = require('anylogger')
var ext = a.ext // save for later

/**
 * `ulog.ext(logger) => logger`
 * 
 * Called when a logger or the `ulog` function needs to be extended, 
 * either because it was newly created, or because it's configuration 
 * or settings changed in some way.
 * 
 * This method must ensure that a log method is available on the logger 
 * for each level in `ulog.levels`.
 * 
 * This override uses noop methods for all log methods that are below 
 * the active log level.
 */
a.ext = function(l) {
	if (l) {
		if (l !== a) 	ext(l) // create default methods by calling anylogger.ext
		// call ext on all registered mods that have that method
		for (var n in a.mods) {
			if (a.mods[n].ext) a.mods[n].ext(l)
		}
	}
	else {
		a.ext(a)
		for (l in a()) 
			a.ext(a()[l])
	}
	return l
}

/**
 * `ulog.add(type, components)`
 * 
 * Adds `components` of `type` to ulog.
 * 
 * Possible types include `'mods'`, `'options'`, 
 * `'outputs'` and  `'formats'`.
 */
a.add = function(t, c) {
	for (var n in c) (a[t] || (a[t] = {}))[n] = c[n]
	a.ext()
}
