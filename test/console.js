
module.exports = function(sinon){
	var result = {
		error: sinon.spy(), 
		warn: sinon.spy(), 
		info: sinon.spy(), 
		log: sinon.spy(), 
		debug: sinon.spy(), 
		trace: sinon.spy(),
	}
	result.debug.flag = true
	return result
}