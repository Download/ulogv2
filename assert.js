var a = module.exports = require('./core')

module.exports = {
  ext: function(l) {
    if (l != a) {
      l.assert = function(){
        var a=[].slice.call(arguments)
        if (!a.shift()) l.error.apply(l, a)
      }
    }
  }
}