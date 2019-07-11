// var ulog = require('../node')

module.exports = parse

function parse(node, components) {
	var next, input = node, result = []
	while ((next = nextComponent(input, components)) !== null) {
    var start = next.idx + next.name.length + 1
    var before = input.substring(0, next.idx)
    if (before) {result.push(before)}
    var skipped = input.substring(next.idx, start)
    var remaining = input.substring(start)
    var body = componentBody(remaining)
    if (body) {
      result.push({
        name: next.name,
        cfg: body.arg,
        component: components[next.name],
        children: body.arg ? parse(body.arg, components) : body.arg
      })
      input = remaining.substring(body.end + 1)
    }
		else { // invalid, return original text
			result.push(skipped + remaining)
		}
	}
	if (input) {result.push(input)}
	return result.length === 1 ? result[0] : result
}

function nextComponent(str, components) {
  var next = {component:null, idx:-1}
  Object.keys(components).forEach(function(component){
		var exp = new RegExp('\\{' + escape(component) + '.*\\}')
		var idx = str.search(exp)
		if ((idx !== -1) && ((next.idx === -1) || (idx < next.idx)) && (str[idx+component.length+1])) {
			next.idx = idx
			next.name = component
		}
  })
	for (var i=0,component; component=components[i]; i++) {
		var exp = new RegExp(escape(component)) // new RegExp(tag.replace('.', '\\.') + '{.*}')
		var idx = str.search(exp)
		if ((idx !== -1) && ((next.idx === -1) || (idx < next.idx)) && (str[idx+component.length+1])) {
			next.idx = idx
			next.name = component
		}
	}
	return next.name ? next : null
}

function componentBody(tokenstream) {
	// loop through the string, parsing it as we go through it
	// return the fully resolved body
	var result = {arg:null, end:-1}
	var inString=false
	var esc = false
	var open=0
	var whitespace = /\s/
	for (var i=0; i<tokenstream.length; i++) {
		var token = tokenstream[i]
		if (!inString) {
			if (token === '{') {
				open++
			}
			if (token === '}') {
				if (!open) {
					result.end = i
					if (result.arg && result.arg[0] === '\'' && result.arg[result.arg.length-1] === '\'') {
						result.arg = result.arg.substring(1, result.arg.length-1)
					}
					return result
				}
				open--
			}
			if (token === '\'') {
				inString = true
				if (esc) {continue}
			}
			if (result.arg===null && token.search(whitespace)===0) {continue}
		}
		else { // inString
			if (token === '\'') {
				inString = false
				esc = true
			}
		}
		if (result.arg === null) {
			result.arg = ''
		}
		result.arg += token
		esc = false
	}
	return null
}










function convertQuotes(payload) {
	if (!payload || typeof payload != 'string') {return payload}
	var result = ''
	var inString = false
	var esc = false
	for (var i=0; i<payload.length; i++) {
		var token = payload[i]
		if (inString) {
			if (token === '\'') {
				if (esc) {
					// 2 consecutive quotes inside a string are escaped to a single quote
					result += '\''
					esc = false
				}
				else {
					// encountered a quote... might be first of multiple, flag but do nothing yet
					esc = true
				}
			}
			else {
				if (esc) {
					// the previous quote stands on it's own, so it's a string terminator
					result += '"'
					inString = false
				}
				esc = false
				result += token
			}
		}
		else { // ! inString
			if (token === '\'') {
				result += '"'
				inString = true
			}
			else {
				result += token
			}
		}
	}
	if (esc) {
		result += '"'
	}
	log.debug('convertQuotes(' + payload + ') ==> ', result)
	return result
}

function escape(regex) {
	return regex.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}