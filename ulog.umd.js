(function(u,m,d){
	typeof define == 'function' && define.amd ? define(m,[],d) : (u[m] = d())
})(this, 'ulog', function(){'use strict'
// ulog - microscopically small universal logging library
// © 2019 by Stijn de Witt, some rights reserved
// License: CC-BY-4.0
module.exports = function(
  defaults, // the default settings
	get, // gets the logging config from the environment
	set, // sets the logging config in the environment
	ext // extension, if any
){
	var a = require('anylogger')

	// The options that ulog supports
	a.options = {
		// the value is a transform used in the property accessor
		level: function(v) {
			return (v !== undefined) && (Number(v)!==Number(v) ? a.levels[v.toLowerCase()] : Number(v))
		}, 
		output: function(v) {
			return v && v.split(/[\s,]+/) || []
		},
		format: function(v) {
			return v && v.split(/[\s,]+/) || []
		}
	}

	// The outputs that ulog supports (may be extended via plugins etc)
	a.outputs = { console: typeof console != 'undefined' && console }

	// The formats that ulog supports (may be extended via plugins etc)
	a.formats = {}

	var settings = {}
	for (var o in a.options) settings[o] = []
	settings.debug = []

	/**
	 * `ulog.set(name, value, [persist])`
	 * 
	 * Sets the setting named `name` based on the given `value`.
	 * If `persist` is true, the value will be persisted to the environment
	 * (where supported), otherwise, the change will be made in memory only.
	 * 
	 * E.g. to set the log level for all loggers to 'warn':
	 * 
	 * `ulog.set('level', 'warn')`
	 * 
	 * The `value` may contain a literal value for the setting, or
	 * it may contain a semicolon separated list of expression = value pairs, 
	 * where expression is a debug-style pattern and value is a literal value 
	 * for the setting.
	 * 
	 * E.g. to set the log level for libA to error, for libB to info and for 
	 * all other loggers to warn:
	 * 
	 * `ulog.set('level', 'libA=error; libB=info; *=warn')`
	 * 
	 * Both forms may be combined:
	 * 
	 * `ulog.set('level', 'warn; libA=error; libB=info')` // same as above
	 * 
	 * (only the first single value listed is used, any others are ignored).
	 * 
	 * The expression=value pairs are evaluated in the order they are listed,
	 * the first expression to match decides which value is returned. 
	 * 
	 * The expression itself can be a list of patterns and contain wildcards 
	 * and negations, just like in debug:
	 * 
	 * `ulog.set('level', 'info; lib*,-libC=error; libC=warn')`
	 */
	a.set = function(name, value, persist) {
		console.info('ulog.set', name, value)
		settings[name] = []
		var items = (value || '').split(/[\s]*;[\s]*/)
		// parse `ulog` style settings, include support for `debug` style
		var d = name == 'debug'
		var implied
		for (var i=0,item; item=items[i]; i++) {
			var x = item.split(/\s*=\s*/)
			// ulog: expressions is first param or none if only a setting value is present (implied)
			// debug: expressions is always first and only param
			var expressions = ((x[1] || d) && x[0] || '').split(/[\s,]+/)
			// ulog: setting value is second param, or first if only a value is present (implied)
			// debug: setting value is always implied
			var setting = { value: x[1] || (!d && x[0]) || (d && a.levels.d), incl: [], excl: [] }
			if (expressions.length) {
				settings[name].push(setting)
			}
			else if (!d && !implied) {
				implied = setting
				expressions.push('*')
			}
			else continue /* skip subsequent implied items */
			// add the expressions to the incl/excl lists on the setting
			for (var j=0,s; s=expressions[j]; j++) {
				s = s.replace(/\*/g, '.*?')
				if (s[0] === '-') setting.excl.push(new RegExp('^' + s.substr(1) + '$'))
				else setting.incl.push(new RegExp('^' + s + '$'))
			}
		}	
		// if a setting was implied, add it last so it acts as a default
		if (implied) settings[name].push(implied)
		// persist to the environment
		if (persist) set(name, value)
		// re-extend all loggers so they can update to the new settings
		console.info('ulog.set', 're-extend')
		for (var n in a()) a.ext(a()[n])
	}

	/**
	 * `ulog.get([name], [logger])`
	 * 
	 * Gets the value of the setting named `name`, either globally or for the given 
	 * `logger`. If no `name` is given, all available settings are returned as an object.
	 * 
	 * Given that `level` is set to `info; libA=warn; libB=error`
	 * 
	 * `ulog.get()` would yield an an object with for each of the options, an 
	 * array of settings objects, each containing lists of regular expressions 
	 * to include or exclude modules and a value for the setting:
	 * 
	 * {
	 *   level: [
	 *     {
	 *       value: 'warn',
	 *       incl: [/^libA$/],
	 *       excl: []
	 *     }, {
	 *       value: 'error', 
	 *       incl: [/^libB$/], 
	 *       excl: []
	 *     }, {
	 *       value: 'info', 
	 *       incl: [/^.*$/], 
	 *       excl: []
	 *     }
	 *   ],
	 *   output: [
	 *     // ...
	 *   ],
	 *   format: [
	 *     // ...
	 *   ],
	 *   debug: [
	 *     // ...
	 *   ]
	 * }
	 * 
	 * `ulog.get('level')` would yield `'info'`.
	 * `ulog.get('level', 'libA')` would yield `'warn'`.
	 * 
	 * `logger` can be a logger function, or a logger name.
	 */
	a.get = function(n,l) {
		if (!n) return settings
		l = (typeof l == 'string') && l || (l && l.name) || ''
		for (var i=0,s; s=settings[n][i]; i++) {
			for (var j=0,excl; excl=s.excl[j]; j++)
				if (excl.test(l)) continue
			for (var j=0,incl; incl=s.incl[j]; j++)
				if (incl.test(l)) return s.value
		}
		return defaults[n]
	}

	/**
	 * `ulog.load([name])`
	 * 
	 * (re)loads the configuration from the environment.
	 * 
	 * @param {String} name Optional name of the option to load.
	 * 
	 * If `name` is given, only that option is loaded. Otherwise
	 * all options are loaded.
	 */
	a.load = function(n){
		if (n) a.set(n, get(n))
		else Object.keys(a.options).concat(['debug']).forEach(a.load)
	}

	// backward compat with debug API
	a.enable = a.set.bind(this, 'debug')
	a.disable = a.set.bind(this, 'debug', '')
	a.enabled = a.get.bind(this, 'debug')

	/**
	 * `ulog.new`
	 * 
	 * Creates a new logger.
	 * This method is called by `anylogger` to create a logger.
	 * It is recommended you create loggers through `anylogger`:
	 * 
	 * var anylogger = require('anylogger') 
	 * var log = anylogger('my-lib')
	 * log.info('Like this')
	 */
	var make = a.new // save for later
	a.new = function(
		n, // name
		c // config
	) {
		var l = make(n,c) // create logger
		for (k in a.levels) l[k.toUpperCase()] = a.levels[k]
		for (o in a.options) createProp(l, o)
		ext && ext(l,n,c) // run platform extensions, if any
		return l;
	}

	/**
	 * Called when a logger needs to be extended, either because it was newly
	 * created, or because it's configuration or settings changed in some way.
	 * 
	 * `anylogger.ext(logger) => logger`
	 * 
	 * This method must ensure that a log method is available on the logger for
	 * each level in `anylogger.levels`.
	 * 
	 * This override checks the active log level and uses noop methods for all
	 * log methods that are below the active log level.
	 */
	a.ext = function(l) {
		// determine the effective log level
		var lvl = Math.max(a.enabled(l) && a.levels[l.DEBUG] || l.NONE, l.level)
		// create the output
		var o, outputs = l.output
		if (outputs.length > 1) {
			// create an object with functions that call all outputs
			o = {}
			for (v in a.levels) {
				o[v] = function(){
					for (var i=0,out; out=outputs[i]; i++) {
						out = a.outputs[out]
						out && ((out[v] || out.log).apply(l, arguments))
					}
				}
			}
		}
		else {
			// direct assignment of the output object
			o = a.outputs[outputs[0]] || a.outputs.console
		}
		// setup formatting
		var formats = l.format
		for (v in a.levels) {
			var enabled = lvl >= a.levels[v]
			var fn = enabled && (o[v] || o.log) || function(){}
			if (!enabled || !formats.length) l[v] = fn // use direct assignment
			else { 
				// create a function that calls all formatters
				l[v] = function(){
					var a = [].slice.call(arguments)
					var ts = new Date().getTime()
					for (var i=0,f; f=formats[i]; i++)
						a.formats[f] && a.formats[f](l, v, a, ts)
					fn.apply(l, a)
				}
			}
		}
		return l;
	}

	function createProp(l, n) {
		Object.defineProperty(l, n, {
			get: function(){
				var result = a.options[n](a.get(n, l))
				return result
			}
		})
	}

  // Initialize ulog instance
	for (o in a.options) createProp(a, o)
	a.load()
	return a
}
module.exports = require('./ulog')(
  // default settings
  {
    level: 'warn',
    output: 'console',
  },

	function(n){
		try {return localStorage.getItem(name(n))}
		catch(e){}
	},

	function(n,v) {
		try {
			if (v === undefined) localStorage.removeItem(name(n))
			else localStorage.setItem(name(n), v)
		}	catch(e){}
	}
)

function name(n){
  return ({level:'log', output:'log_output', format:'log_format'})[n] || n
}


/*


var qs = location.search.substring(1),
		args = qs && qs.split('&'),
		lvl, dbg, i, m

try {
	lvl = localStorage.getItem('log')
	dbg = localStorage.getItem('debug')
} catch(e) {}

for (i=0; m=args && args[i] && args[i].split('='); i++) {
	m[0] == 'log' ? lvl = m[1] : 0
	m[0] == 'debug' ? dbg = m[1] : 0
}

log.con = function(){return window.console}
dbg && log.enable(dbg)
log()
log.level = lvl || log.WARN

return log
*/
}) // umd
