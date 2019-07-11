
module.exports = function name(cfg) {
  
  return function(rec) {
    return rec.name = rec.name || rec.logger.name
  }
}
