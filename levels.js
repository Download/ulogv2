console.info('ulog:levels')

var a = require('./core')

a.add('options', {
  // level option
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
  }
})

module.exports = {
  ext: function(l) {
    l.NONE = 0
    l.ALL = 9007199254740991 // Number.MAX_SAFE_INTEGER
    for (var v in a.levels) {
      l[v.toUpperCase()] = a.levels[v]
      if (l != a && (l.level < a.levels[v])) l[v] = function noop(){}
    }
  }
}
