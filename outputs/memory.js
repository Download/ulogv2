var memory = module.exports = function(cfg){
  memory.messages = memory.messages || []
  return function(rec){
    memory.messages.push(rec)
  }
}
