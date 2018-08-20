'use strict'



module.exports = {
	clone: (o) => {
		return JSON.parse(JSON.stringify(o))
	}
}