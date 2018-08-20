'use strict'

const mysql = require('mysql')

const config = require('./config')




const connection = mysql.createConnection({
	localAddress: config.mysql.host,
	port: config.mysql.port,
	user: config.mysql.user,
	password: config.mysql.password,
	database: config.mysql.schema,
	timezone: 'Z',
})
connection.connect()



const enhanceError = (err) => {
	if (err && err.sql) {
		err.message = 'Database error in "'+err.sql+'": '+err.message
	}
	return err
}




class Database {
	escapeIdentifier(text) {
		return connection.escapeId(text)
	}


	/**
	 * @param sql string
	 * @param params array
	 * @param next function(err, rows, fields)
	 */
	async select(sql, params, next) {
		return await this._query(config.logging.mysql.selects, sql, params)
	}

	async selectRow(sql, params, next) {
		const rows = await this.select(sql, params)
		return rows.length? rows[0] : null
	}

	async selectCol(sql, params, next) {
		const rows = await this.select(sql, params)
		return rows.map(row => {
			for (const prop in row) {
				return row[prop]
			}
		})
	}


	/**
	 * @param sql string
	 * @param params array
	 * @param next function(err, rows, fields)
	 */
	async selectNested(sql, params, next) {
		const options = {
			sql: sql,
			values: params,
			nestTables: true
		}
		return await this._query(config.logging.mysql.selects, options)
	}


	/**
	 *
	 */
	async insert(sql, params, next) {
		const r = await this._query(config.logging.mysql.changes, sql, params)
		return {
			insertId: r.insertId,
			affectedRows: r.affectedRows
		}
	}


	/**
	 *
	 */
	async update(sql, params, next) {
		return await this._query(config.logging.mysql.changes, sql, params).affectedRows
	}


	/**
	 * @param sql string
	 * @param params array
	 * @param next function(err, rows, fields)
	 */
	async delete(sql, params, next) {
		return await this._query(config.logging.mysql.changes, sql, params).affectedRows
	}


	async _query(log, ...args) {
		return new Promise((res, rej) => {
			const r = connection.query(...args, (err, a, b, c) => {
				if (log) {
					console.log('DB: ', r.sql)
				}
				if (err) rej(enhanceError(err))
				res(a)
			})
		})
	}
}



module.exports = new Database()