module.exports = function(
  dl, // the default log level
  get, // gets the logging settings from the environment
){
  var 
  m = {}, // stores log modules keyed by name
  gl = get(), // global log level, init from environment

  // the main anylogger factory function
  any = function(n,o){
    // return the existing logger, or create a new one. if no name was given, return all loggers
    return n ? m[n] || (m[n] = any.patch(any.extend(any.create(n),n,o))) : m
  }

  // the supported log levels
  any.levels = {error:10, warn:20, info:30, log:40, debug:50, trace:60}

  // read/write property for the global log level
  Object.defineProperty(any, 'level', {
    get: function(){return gl || dl}, // global log level if set, otherwise default level
    set: function(v){gl = v; for (var n in m){any.patch(m[n])}} // set (or clear) gl, then re-patch all loggers
  })

  // any.console is what will be used to do the logging. May be undefined
  // in which case no logging will happen.
  // defaults to the actual console, but may be replaced by another implementation
  // for example an object that applies formatting to the messages before logging them
  any.console = (typeof console != 'undefined') && console

  // this method is called when a logger needs to be created.
  any.create = function(n,r) {
    // use eval to create a named function, this method has best cross-browser support
    // and allows us to create functions with names containing symbols such as ':', '-' etc
    // which otherwise are not legal in identifiers
    // the created function calls any.invoke to call the actual log method
    eval("r = {'" + n + "': function(){any.invoke(n, [].slice.call(arguments))}}[n]")
    // if you want to do extra stuff inside the logger function, consider
    // overriding any.invoke instead of this method.
    // IE support: if the function name is not set, add a property manually
    return r.name ? r : Object.defineProperty(r, 'name', {get:function(){return n}})
    // the logging methods will be added by any.patch
  }

  // this method is called from the logger function created by any.create.
  // you can override this method to change invocation behavior.
  // this method inspects the first argument to determine the log level to
  // log at and then calls the correct method on the logger function with
  // the remaining arguments. 
  any.invoke = function(n,a) {
    m[n][a.length > 1 && any.levels[a[0]] ? a.shift() : 'debug'].apply(m[n], a)
  }

  // this method is called when new loggers have been created and need to 
  // be extended. override/chain it to hook in extra behavior
  any.extend = function(log,n,o){
    var ll = get(n) || o && o.level // local log level, init from environment or options
    return Object.defineProperty(log, 'level', {
      get: function(){return ll || any.level}, // local log level if available, or global level
      set: function(v){ll = v; any.patch(log)}
    })
  }

  // this method is called when a logger has been newly created, or when it's level has changed.
  // it must ensure that the log methods on the logger corresponding to the log levels in any.levels
  // are delegated to any.console methods or to noop functions, depending on the active log level
  any.patch = function(log) {
    for (v in any.levels){
      log[v] = any.levels[log.level] >= any.levels[v] && any.console ? any.console[v] || any.console.log : function(){}
      // the fallback to any.console.log allows arbitrary log methods to be created from any console-like
      // object that has at least a single log() method.
      // e.g. you can define any.levels to include a level 'silly' and it will be delegated to console.log.
    }
    return log;
  }

  // and that's it. modular loggers supporting levels, formatters and whatever comes up.
  // fully extensible with a minimal footprint. thanks for your interest!
  return any;
}
