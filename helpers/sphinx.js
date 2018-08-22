'use strict'

const mysql = require('mysql')

const config = require('./config')



const errorHandler = (err) => {
	if (!err.fatal) {
			return
	}
	if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
		throw err
	}
	connection = mysql.createConnection(connection.config)
	connection.on('error', errorHandler)
	connection.connect()
}


let connection = mysql.createConnection({
	localAddress: config.sphinx.host,
	port: config.sphinx.port
})
connection.on('error', errorHandler)




module.exports = {
	/**
	 * @param sql string
	 * @param params array
	 * @return rows
	 */
	query: async(sql, params) => {
		return new Promise((resolve, reject) => {
			connection.query(sql, params, (err, rows, fields) => {
				if (err) return reject(err)
				resolve(rows)
			})
		})
	}
}
