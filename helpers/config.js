'use strict'

const fs = require('fs')



const configPaths = [
	__dirname+'/../config/config.json',
	__dirname+'/../config/config.platform.json'
]



var config = {}
configPaths.forEach((path) => {
	var extend = function(target, source) {
		for ( var prop in source ) {
			if ( typeof source[prop]==='object' && typeof target[prop]!=='undefined' ) {
				extend( target[prop], source[prop] );
			} else {
				target[prop] = source[prop];
			}
		}
	}
	var exists = false
	try {
		exists = fs.statSync(path).isFile()
	}
	catch (e) {
	}
	if (exists) {
		var o = require(path)
		extend(config, o)
	}
})



module.exports = config
