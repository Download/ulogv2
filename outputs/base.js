console.info('ulog:outputs:base')

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
  }
})

a.add('outputs', {
  console: typeof console != 'undefined' && console
})

module.exports = {
  ext: function(l) {
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
}

function output(l){
  var outputs = parseComponents(l.output, a.outputs)
  return outputs.length === 1 ? outputs[0] : multiplex(l, outputs)
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
  }, {})
}

