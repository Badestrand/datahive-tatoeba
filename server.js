'use strict'

const cookieParser = require('cookie-parser')
const express = require('express')
const fs = require('fs')
const path = require('path')

const config = require('./helpers/config')
const database = require('./helpers/database')
const utils = require('./helpers/utils')




async function extendSentences(rows, query) {
	const allSentenceIds = rows.map(row => row.id)
	if (allSentenceIds.length === 0) {
		return
	}
	// Include all links?
	if (query.links !== undefined) {
		const allLinkRows = await database.select('SELECT sentences.*, links.sentence_id_1 AS link_sentence_id FROM links, sentences where links.sentence_id_1 IN (?) AND links.sentence_id_2=sentences.id', [allSentenceIds])
		for (const row of rows) {
			row.links = allLinkRows.filter(linkRow => linkRow.link_sentence_id===row.id).map(linkRow => {
				const linkRowCopy = utils.clone(linkRow)
				delete linkRowCopy.link_sentence_id
				return linkRowCopy
			})
		}
	}
	// Include all tags?
	if (query.tags !== undefined) {
		const allTagRows = await database.select('SELECT * FROM tags WHERE sentence_id IN (?)', [allSentenceIds])
		for (const row of rows) {
			row.tags = allTagRows.filter(tagRow => tagRow.sentence_id===row.id).map(tagRow => tagRow.tag)
		}
	}
}




const server = express()

server.use(cookieParser())




if (config.debug) {
	// Log request
	server.use((req, res, next) => {
		console.log(req.method, req.url, req.body? JSON.stringify(req.body) : '')
		next()
	})

	// Pretty print JSON
	server.use((req, res, next) => {
		res.json = (obj) => {
			res.header('Content-Type', 'application/json')
			res.send(JSON.stringify(obj, null, 4))
		}
		next()
	})
}



const apiRoute = (fn) => (req, res) => {
	Promise.resolve(fn(req, res)).catch((err) => {
		console.error(err)
		res.status(err.httpStatusCode || 500)
		res.json({error: err.message})
	})
}



// -- Routes --
function useQueryParam(param, defaultValue, prepareFunc) {
	if (param === undefined) {
		return defaultValue
	}
	return prepareFunc(param)
}

// /sentences
//   [lang=eng]
//   [lang2=deu]
//   [tag=maths]
//   [links]
//   [tags]
//   [offset=1000]
//   [limit=500]
server.get('/sentences', apiRoute(async(req, res) => {
	const offset = useQueryParam(req.query.offset, 0, s=>Math.max(0, parseInt(s)))
	const maxLimit = req.query.links!==undefined? 250 : 1000
	const limit = useQueryParam(req.query.limit, maxLimit, s=>Math.min(maxLimit, Math.max(0, parseInt(s))))

	let r
	if (req.query.tag === undefined) {
		if (req.query.lang === undefined) {
			// -
			r = await database.select('SELECT * FROM sentences LIMIT ?,?', [offset, limit])
		} else if (req.query.lang2 === undefined) {
			// lang
			r = await database.select('SELECT * FROM sentences WHERE lang=? LIMIT ?,?', [req.query.lang, offset, limit])
		} else {
			// lang, lang2
			r = await database.select('SELECT a.*, b.id AS id2, b.lang AS lang2, b.text AS text2 FROM sentences a, sentences b, links WHERE a.id=links.sentence_id_1 AND b.id=links.sentence_id_2 AND a.lang=? AND b.lang=? LIMIT ?,?', [req.query.lang, req.query.lang2, offset, limit])
		}
	} else {
		if (req.query.lang === undefined) {
			// tag
			r = await database.select('SELECT s.* FROM sentences s, tags t WHERE t.tag=? AND s.id=t.sentence_id LIMIT ?,?', [req.query.tag, offset, limit])
		} else if (req.query.lang2 === undefined) {
			// tag, lang
			r = await database.select('SELECT s.* FROM sentences s, tags t WHERE t.tag=? AND s.id=t.sentence_id AND s.lang=? LIMIT ?,?', [req.query.tag, req.query.lang, offset, limit])
		} else {
			// tag, lang, lang2
			r = await database.select('SELECT a.*, b.id AS id2, b.lang AS lang2, b.text AS text2 FROM sentences a, sentences b, links, tags t WHERE a.id=links.sentence_id_1 AND b.id=links.sentence_id_2 AND a.lang=? AND b.lang=? AND a.id=t.sentence_id AND t.tag=? LIMIT ?,?', [req.query.lang, req.query.lang2, req.query.tag, offset, limit])
		}
	}

	await extendSentences(r, req.query)
	res.json(r)
}))


// /sentences/2263
// /sentences/42849,66989
//   [links]
//   [tags]
server.get('/sentences/:id', apiRoute(async(req, res) => {
	const sentenceIds = req.params.id.split(',').slice(0, 1000)
	let r = await database.select('SELECT * FROM sentences WHERE id IN (?)', [sentenceIds])
	await extendSentences(r, req.query)
	res.json(r)
}))


// /tags
server.get('/tags', apiRoute(async(req, res) => {
	const r = await database.selectCol('SELECT DISTINCT(tag) FROM tags')
	res.json(r)
}))


// /license
server.get('/license', apiRoute(async(req, res) => {
	res.sendFile(path.resolve(__dirname, './CC BY 2.0.json'))
}))



// -- Error handling --
server.use('*', (req, res, next) => {
	res.status(404)
	res.json({error: 'Invalid route '+req.method+' '+req.originalUrl})
})

server.use((err, req, res, next) => {
	console.error(err)
	res.status(err.httpStatusCode || 500)
	res.json({error: err.message})
})

process.on('unhandledRejection', error => {
	console.error('unhandledRejection', error)
})



// -- Start server --
server.listen(config.api.port, () => {
	console.log('Listening on ' + config.api.port)
})
