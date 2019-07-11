// ulog - the universal logger
// © 2019 by Stijn de Witt, some rights reserved
// License: CC-BY-4.0

// this module provides the bulk of the code but is not the main entry point
// node.js and browser.js are the entry points for Node and browsers
// these files require this one and call this function, providing the arguments
module.exports = function(
  defaults, // the default settings
	get, // gets the logging config from the environment
	set, // sets the logging config in the environment
	ext // extension, if any
){
	// import anylogger as ulog supports it natively
	var a = require('anylogger')

	// The options that ulog supports (may be extended via plugins etc)
	a.options = {

		// level
		//
		// defaults to 'INFO' (Node) or 'WARN' (browsers)
		// may contain multiple expression=setting pairs separated by semicolons
		// e.g. 'WARN' or 'info; my-module=debug', etc.
		// if no expression is listed, the wildcard (*) is implied.
		// the setting is a log level, such as 'warn', 'ERROR' or 'info'
		// see also `ulog.levels`
		level: {
			// level number from string
			fromString: function(v) {
				return (v !== undefined) && (Number(v)!==Number(v) 
					? a.levels[v.toLowerCase()] 
					: Number(v)
				)
			},
			// level number to string
			toString: function(v) {
				for (x in a.levels)
					if (a.levels[x] === v)
						return x.toUpperCase()
			},
			// getter extension
			get: function(l,v){
				return Math.max(a.enabled(l) && l.DEBUG || l.NONE, v)
			}
		},

		// output
		//
		// defaults to 'console'
		// may contain multiple expression=setting pairs separated by semicolons
		// e.g. 'console' or 'console; my-module=file(out.log)' etc.
		// if no expression is listed, the wildcard (*) is implied.
		// the setting value is a pipe separated list of outputs
		// each output may optionally receive a config string between braces
		// the config string may not contain any semicolons or pipes
		// configured outputs that are not available in the environment are ignored
		// see also `ulog.outputs`
		output: {},

		// format
		//
		// may contain multiple expression=setting pairs separated by semicolons
		// e.g. 'printf' or 'printf; test=printf|debug(time level name>30 msg)' etc.
		// if no expression is listed, the wildcard (*) is implied.
		// the setting value is a pipe-separated list of formats
		// each format may optionally receive a config string between braces
		// the config string may not contain any semicolons or pipes
		// configured formats that are not available in the environment are ignored
		// see also `ulog.formats`
		format: {},
	}

	// The outputs that ulog supports (may be extended via plugins etc)
	a.outputs = Object.create(null)
	a.outputs.console = typeof console != 'undefined' && console

	// The formats that ulog supports (may be extended via plugins etc)
	a.formats = Object.create(null)

	// the settings as applicable 
	var settings = Object.create(null)

	/**
	 * `ulog.set(name, value, [persist])`
	 * 
	 * Sets the setting for the option named `name` to the given `value`.
	 * If `persist` is true, the value will be persisted to the environment
	 * (where supported), otherwise, the change will be made in memory only.
	 * 
	 * E.g. to set the log level for all loggers to 'warn':
	 * 
	 * `ulog.set('level', 'warn')`
	 * 
	 * The `value` may contain a literal value for the setting, or
	 * it may contain a semicolon separated list of expression=value pairs,
	 * where expression is a debug-style pattern and value is a literal value 
	 * for the setting. The literal value may not contain any semicolons.
	 * 
	 * E.g. to set the log level for libA to ERROR, for libB to INFO and for 
	 * all other loggers to WARN:
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
	 * and negations:
	 * 
	 * `ulog.set('level', 'info; lib*,-libC=error; libC=warn')`
	 * 
	 * The values are interpreted differently for different settings.
	 */
	a.set = function(name, value, persist) {
		// this wipes any parsed/cached results that were stored on the setting
		settings[name] = value 
		// persist to the environment
		if (persist) set(name, value)
		// re-extend all loggers so they can update to the new settings
		for (var n in a()) a.ext(a()[n])
	}

	/**
	 * `ulog.get([name], [logger])`
	 * 
	 * Gets the setting string for the option named `name`.
	 * 
	 * If no `name` is given, all available settings are returned as an object
	 * with setting strings keyed on option name. Otherwise, if only `name` is
	 * given, the setting string for the option named `name` is returned.
	 * 
	 * `logger` is a logger name. If this second parameter is given, the setting
	 * is evaluated for that specific logger and the result is returned. If empty
	 * string is given as logger name, the global/default setting is returned.
	 * 
	 * For example, given that the following settings are active:
	 * 
	 * `{ level: 'info; libA=warn; libB=error', output: 'console' }`
	 * 
	 * These following statements would be true:
	 * 
	 * `JSON.stringify(ulog.get()) == '{"level":"info; libA=warn; libB=error","output":"console"}'`
	 * `ulog.get('output') == 'console`
	 * `ulog.get('level') == 'info; libA=warn; libB=error'`
	 * `ulog.get('level', 'libA') == 'warn'`
	 * `ulog.get('level', 'libB') == 'error'`
	 * `ulog.get('level', 'libC') == 'info'`
	 * `ulog.get('level', '') == 'info'`
	 */
	a.get = function(n,l) {
		if (!n) return settings 
		if (l === undefined) return settings[n]
		// use parsed settings if they exist, or parse now and save for later use
		var set = settings[n] 
			? settings[n].parsed || (settings[n].parsed = parseSetting(settings[n], n == 'debug')) 
			: []
		// use the cached settings if they exist, or create now and save for later
		var c = Object.create(null)
		c = settings[n] ? settings[n].cached || (settings[n].cached = c) : c
		// because we save the parsed and cached settings on the setting string 
		// they can never go out-of-date; whenever the setting string is 
		// overwritten, the parsed/cached settings are cleaned up as well
		return c[l] !== undefined ? c[l] : (c[l] = evaluate(set, l, defaults[n]))
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
		enhance(l, true /* createSetters? */)
		ext && ext(l,n,c) // run platform extensions, if any
		return l;
	}

	/**
	 * Called when a logger needs to be extended, either because it was newly
	 * created, or because it's configuration or settings changed in some way.
	 * 
	 * `ulog.ext(logger) => logger`
	 * 
	 * This method must ensure that a log method is available on the logger 
	 * for each level in `ulog.levels`.
	 * 
	 * This override uses noop methods for all log methods that are below 
	 * the active log level.
	 */
	a.ext = function(l) {
		// setup the output(s)
		var o = output(l.output)
		// setup formatting
		var f, formats = parseComponents(l.format, a.formats)
		f = formats.length === 1 
		var emitters = formats.reduce(toEmitter, [])
		// (re)create logging methods
		Object.keys(a.levels).forEach(function(v){
			var enabled = l.level >= a.levels[v]
			var fn = enabled && (o[v] || o.log) || function(){}
			l[v] = !enabled || !formats.length ? fn : function(){
				var rec = { name: l.name, level: v, msg: [].slice.call(arguments) }
				emitters.forEach(emit(rec))
				var msg = formats.reduce(format)
				fn.apply(l, msg)
			}
		})
		return l
	}

	// INITIALIZE
	enhance(a)
	a.load()
	return a
  // /INITIALIZE


	// HELPER FUNCTIONS

	function enhance(l, s /* createSetters? */) {
		l.NONE = 0
		l.ALL = 9007199254740991 // Number.MAX_SAFE_INTEGER
		for (k in a.levels) l[k.toUpperCase()] = a.levels[k]
		for (o in a.options) createProp(l, o, s /* createSetters? */)
		return l;
	}

	function createProp(l, n, s /* createSetters? */) {
		var def = {}, o = a.options[n], value
		def.get = function(v){
			v = value !== undefined ? value : a.get(n, l === a ? '' : l.name)
			v = o && o.fromString ? o.fromString(v) : v
			v = o && o.get ? o.get(l, v) : v
			return v
		}
		def.set = s /* createSetters? */ && function(v){
			v = o && o.set ? o.set(v) : v
			v = o && o.toString ? o.toString(v) : v
			value = v
		}
		Object.defineProperty(l, n, def)
	}


	/**
	 * Parses the setting value string, returning an array of setting value objects
	 * 
	 * e.g `parseSetting('warn; test=debug')` would yield: 
	 * 
	 * [{
	 * 	incl: [test],
	 * 	excl: [],
	 * 	value: 'debug'
	 * },{
	 *   incl: [*],
	 *   excl: [],
	 *   value: 'warn'
	 * }]`
	 * 
	 * @param {String} value The setting string to parse
	 * @param {Boolean} d Debug? If enabled, parses like the debug module, otherwise like ulog
	 * 
	 * @returns {Array} The parsed setting value objects
	 */
	function parseSetting(value, d /* debug? */) {
		var settings = []
		var items = (value||'').split(/(?<!\\);/).map(function(x){return x.replace('\\;', ';')})
		// parse `ulog` style settings, include support for `debug` style
		var implied = []
		for (var i=0,item,idx; item=items[i]; i++) {
			var x = ((idx = item.indexOf('=')) == -1) 
					? [item.trim()] 
					: [item.substring(0,idx).trim(), item.substring(idx + 1).trim()]
			// ulog: expressions is first param or none if only a setting value is present (implied)
			// debug: expressions is always first and only param
			var expressions = x[1] || d ? x[0].split(/[\s,]+/) : []
			// ulog: setting value is second param, or first if only a value is present (implied)
			// debug: setting value is always implied level 'debug'
			var setting = { value: x[1] || (!d && x[0]) || (d && a.levels.debug), incl: [], excl: [] }
			if (expressions.length) {
				settings.push(setting)
			}
			else {
				expressions.push('*')
				implied.push(setting)
			}
			// add the expressions to the incl/excl lists on the setting
			for (var j=0,s; s=expressions[j]; j++) {
				s = s.replace(/\*/g, '.*?')
				setting[s[0]=='-'?'excl':'incl'].push(new RegExp('^' + s.substr(s[0]=='-'?1:0) + '$'))
			}
		}	
		// add implied settings last so they act as defaults
		settings.push.apply(settings, implied)
		return settings
	}

	/**
	 * Evaluates the given parsed setting for the given logger name.
	 * 
	 * @param {Array} set Array of setting values
	 * @param {String} l Logger name
	 * 
	 * @returns {String} The setting value for the given logger name
	 */
	function evaluate(set,l,def){
		for (var i=0,s; s=set[i]; i++) {          	// for all parts ('info; test=debug' has 2 parts)
			for (var j=0,excl; excl=s.excl[j]; j++)   // for all exclusion tests
				if (excl.test(l)) continue              // if logger matches exclude, skip to next part
			for (var j=0,incl; incl=s.incl[j]; j++)		// while no result, for all inclusion tests
				if (incl.test(l)) return s.value    		// if logger matches include, return result
		}
		return def                                  // if not found, return default
	}

	function parseComponents(cfg, components) {
		var name = ''
		var esc = false
		
		for (var c='', pc=0; c=cfg[pc]; pc++) {

		}

		return (cfg || '').split('|').map(function(x){
			var start = x.indexOf('(')
			var end = x.lastIndexOf(')')
			var name = (start === -1 ? x : x.substring(0, start)).trim()
			var cfg = (start >= 0) && (end > start) ? x.substring(start + 1, end).trim() : ''
			var component = components[name]
			return typeof component == 'function' ? component(cfg) : component
		})
		.filter(function(x){return x}) // filter undefined components
	}

	function output(l){
		var outputs = parseComponents(l.output, a.outputs)
		return outputs.length === 1 ? outputs[0] : multiplex(l, outputs)
	}

	fun

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
		
	function toEmitter(r,f){
		if (typeof r == 'function') return r.emit
		r.push(toEmitter(f))
		return r
	}

	function emit(rec){
		return function(emit){
			emit && emit(rec)
		}
	}

	function format(r,x){
		if (typeof r == 'object') return function(format){
			return format && format(r)
		}
		r.push.apply(r, toFormat(x))
		return r
	}

	function multiplex(l, outputs) {
		return Object.keys(a.levels).reduce(function(r, v){
			r[v] = function(){
				outputs.forEach(function(o){
					var f = o[v] || o.log
					f && f.apply(l, arguments)
				})
			}
			return r
		})
	}

	function chain(cfg, components) {
		
	}
}
