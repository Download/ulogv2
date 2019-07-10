// ulog - the universal logger
// © 2019 by Stijn de Witt, some rights reserved
// License: CC-BY-4.0
var ulog = module.exports = require('./ulog')(
  // default settings
  {
    level: 'info',
    output: 'console'
  },

  // get the setting named n from the environment
  function(n) {
    return process.env[name(n)]
  },

  // set the setting named n to value v in the environment
  function(n,v) {
    process.env[name(n)] = v || ''
  },

  // extend newly created loggers with these features
  function(l){
    l.assert = function(){
      var a=[].slice.call(arguments)
      if (!a.shift()) l.error.apply(l, a)
    }
  }
)

function name(n){
  return ({level:'LOG', output:'LOG_OUTPUT', format:'LOG_FORMAT'})[n] || n.toUpperCase()
}
