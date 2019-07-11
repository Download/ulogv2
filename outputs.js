console.info('ulog:outputs')

var a = require('./core')

a.add('options', {
		// output
		//
    // defaults to 'console'
    // 
		// may contain multiple expression=setting pairs separated by semicolons
		// e.g. 'console' or 'console; my-module={file out.log}' etc.
    // if no expression is listed, the wildcard (*) is implied. the setting 
    // value is either the name of an output object, or a 
    // [kurly](https://npmjs.com/package/kurly) template where each top-level
    // tag must be a ulog output tag.
    //
		// see also `ulog.outputs`
  output: {
    // getter extension
    get: function(l,v){
      // called whenever the option `output` is read
      return v
    }
  }
})

a.add('outputs', {
  console: typeof console != 'undefined' && console
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
