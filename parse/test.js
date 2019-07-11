var parse = require('./parse')

var formats = {
	test: function(cgf) {
    cfg = cfg || 'Hello, World!'
    return function(rec) {
			return cfg
		}
	}
}

console.info('test starting')

var test, parsed, evaluated

test = "Let's {test} without arguments"
console.info('test', test)
parsed = parse(test, formats)
console.info('parsed', parsed)

test = "Let's {test ulog!} with arguments"
console.info('test', test)
parsed = parse(test, formats)
console.info('parsed', parsed)

test = "Let's {test 'ulog!'} with quoted arguments"
console.info('test', test)
parsed = parse(test, formats)
console.info('parsed', parsed)

test = "Let's {test {test}} nested"
console.info('test', test)
parsed = parse(test, formats)
console.info('parsed', parsed)


console.info('test done')
