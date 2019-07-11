var a = require('./core')

// the settings as applicable
var settings = {}

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
 * it may contain a semicolon separated list of `expression=value` pairs,
 * where `expression` is a debug-style pattern and `value` is a literal value
 * for the setting. The literal value may not contain any semicolons, or must
 * escape them by preceding them with a backslash: `\;`.
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
 * The `expression=value` pairs are evaluated in the order they are listed,
 * the first `expression` to match decides which `value` is returned. 
 * 
 * The `expression` can be a list of patterns and contain wildcards 
 * and negations:
 * 
 * `ulog.set('level', 'info; lib*,-libC=error; libC=warn')`
 * 
 * The values are interpreted differently for different settings.
 */
a.set = function(name, value, persist) {
  // this wipes any parsed/cached results that were stored on the setting
  settings[name] = value 
  if (persist && a.env.set) a.env.set(name, value)
  for(m in a.mods) a.mods[m].set && a.mods[m].set(name, value, persist)
  a.ext()
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
    ? settings[n].parsed || (settings[n].parsed = a.parseOption(n, settings[n])) 
    : []
  // use the cached settings if they exist, or create now and save for later
  var c = {}
  c = settings[n] ? settings[n].cached || (settings[n].cached = c) : c
  // if we found cached settings, return them now
  if (c[l] !== undefined) return c[l]
  // because we save the parsed and cached settings on the setting string 
  // they can never go out-of-date; whenever the setting string is 
  // overwritten, the parsed/cached settings are cleaned up as well
  c[l] = a.evalOption(set, l)
  for(m in a.mods) a.mods[m].get && a.mods[m].get(c[l])
  return c[l]
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
  if (n) a.set(n, a.env.get(n))
  else for (n in a.options) a.load(n)
}

/**
 * `ulog.enable(expression)`
 * 
 * Enables debug mode for the loggers matching `expression`.
 * 
 * This replaces any previously active expression, so in practice it
 * acts more like a setter. The name `enable` is inherited from 
 * [debug](https://npmjs.com/package/debug) and may be a little 
 * confusing:
 * 
 * ulog.enable('libA')
 * ulog.enable('libB')
 * ulog.enabled('libA')  // => falsy
 * ulog.enabled('libB')  // => truthy
 * ulog.enable('libA,libB')
 * ulog.enabled('libA')  // => truthy
 * ulog.enabled('libB')  // => truthy
 * 
 * Below the surface, this method is bound to `ulog.set('debug', expression)`
 * 
 * @param {String} expression A debug-style expression
 */
a.enable = a.set.bind(this, 'debug')

/**
 * `ulog.disable`
 * 
 * Disables debug mode for all loggers.
 * 
 * Below the surface, this method is bound to `ulog.set('debug', '')`
 */
a.disable = a.set.bind(this, 'debug', '')

/**
 * `ulog.enabled(expression)`
 * 
 * Indicates whether debug mode is enabled for the loggers matching `expression`.
 * 
 * Below the surface, this method is bound to `ulog.get('debug')`
 * 
 * @param {String} expression A debug-style expression
 * 
 * @returns A truthy value when enabled, a falsey value otherwise
 */
a.enabled = a.get.bind(this, 'debug')

/**
 * `ulog.parseOption(name, value) => settings[]`
 * 
 * Parses the option string, returning an array of setting value objects
 * 
 * e.g `parseOption('warn; test=debug')` would yield: 
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
 * @param {String} n The name of the option
 * @param {String} v The option string
 * 
 * @returns {Array} The parsed setting value objects
 */
a.parseOption = function(n, v) {
  var settings = [], 
      d = n == 'debug' // backward compatibility with 'debug'
  var items = (v||'').split(/(?<!\\);/).map(function(x){return x.replace('\\;', ';')})
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
 * Evaluates the given parsed option for the given logger name.
 * 
 * @param {Array} set Array of setting values
 * @param {String} l Logger name
 * 
 * @returns {String} The setting value for the given logger name
 */
a.evalOption = function(set,l){
  for (var i=0,s; s=set[i]; i++) {          	// for all parts ('info; test=debug' has 2 parts)
    for (var j=0,excl; excl=s.excl[j]; j++)   // for all exclusion tests
      if (excl.test(l)) continue              // if logger matches exclude, skip to next part
    for (var j=0,incl; incl=s.incl[j]; j++)		// while no result, for all inclusion tests
      if (incl.test(l)) return s.value    		// if logger matches include, return result
  }
}

/**            
 * `ulog.createOption(logger, name, options)`
 * 
 * Creates an aoption named `name` on the given `logger`, using
 * the provided `options` whenever applicable.
 * 
 * @param {Function} l The logger function, or the `ulog` function
 * @param {String} n The name of the property to create
 * @param {Object} o An options object
 * 
 * The `options` object can have functions `fromString` and `toString` that
 * convert from and to String, and `get` and `set` that are called whenever
 * the property is read or written. 
 * 
 * @returns The given `logger`
 */
a.createOption = function(l, n) {
  var value // private field
  var def = { configurable: true }
  var o = a.options[n]
  def.get = function(v){
    v = value !== undefined ? value : a.get(n, l === a ? '' : l.name)
    v = o && o.fromString ? o.fromString(v) : v
    v = o && o.get ? o.get(l, v) : v
    return v
  }
  if (l !== a) def.set = function(v){
    v = o && o.set ? o.set(v) : v
    v = o && o.toString ? o.toString(v) : v
    value = v
  }
  return Object.defineProperty(l, n, def)
}

module.exports = {
  ext: function(l) {
    for (var n in a.options) a.createOption(l, n)
  }
}
