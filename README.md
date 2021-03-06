
# Overview

This is an unofficial REST API for the [Tatoeba project](https://tatoeba.org/). Tatoeba is a large database of sentences and translations, founded by Trang Ho in 2006. Its content is ever-growing and results from the voluntary contributions of thousands of members.

This API does not contain the data itself (download from [here](https://tatoeba.org/eng/downloads)) and is hosted by [datahive.one](https://datahive.one/) free for use but can just as well be self-hosted. Tatoebas data is licensed under the [Attribution 2.0 Generic (CC BY 2.0)](https://creativecommons.org/licenses/by/2.0/).

The routes, their parameters and result layouts are probably not completely stable as this is the first draft of the API. Feel free to contribute and open tickets.

Next enhancements:
 - Include "Sentences with audio" from https://tatoeba.org/eng/downloads
 - Include User Lists from https://tatoeba.org/eng/downloads
 - Include Extended Sentence Info (username, date added, date modified) from https://tatoeba.org/eng/downloads

# API

## Authentication
If the `api.auth.validator` field in the configuration is specified then the API will require a http basic authentication header that gets validated with a post request to that `api.auth.validator` uri.

## Error indication
Errors are indicated by HTTP status codes and the response JSON contains the `error` field. Example:
```
404 Not Found
{
	"error": "Invalid route: GET /somewhere"
}
```


## Response Codes
So far this API only features information retrieval via GET requests and in case of success always returns the HTTP status code 200.

## Routes
### List sentences
Returns an array with each sentence having the form `{id, lang, text}`. The `lang2`, `tag`, `links` and `tags` parameter add further attributes, see below.

You can enumerate the whole database by increasing the `offset` parameter and stopping when the returned number of sentences is less than the specified limit (given you specified a limit less or equal the maximum).

**Route**: `GET /sentences`

**Parameters**:
 - `lang`: (optional) A three character [language code](https://en.wikipedia.org/wiki/ISO_639-3). If specified, only sentences from that language get returned
 - `lang2`: (optional) A three character [language code](https://en.wikipedia.org/wiki/ISO_639-3). If this and `lang` are specified,  only sentences get returned that have a linked sentence in `lang2` and fields `id2, lang2, text2` are added
 - `tag`: (optional) A tag name from the list of `/tags` so that only sentences tagged by that get returned
 - `links`: (optional) Each entry will contain a `links` array with all linked sentence objects with fields  `{id, lang, text}`
 - `tags`: (optional) Each entry will contain a `tags` array with the associated tag names
 - `offset`: (optional) For paging, the starting entry
 - `limit`: (optional) For paging, the amount of entries. Maximum of 1000 and if the `links` parameter is specified, a maximum of 250


**Example**: 
`GET /sentences?tag=maths&lang=eng&lang2=deu&links&tags&offset=10&limit=5`
=>

	[{
		"id": 2263,
		"text": "The functions sine and cosine take values between -1 and 1 (-1 and 1 included).",
		"id2": 1088,
		"text2": "Die Funktionen Sinus und Cosinus nehmen Werte zwischen -1 und 1 an (-1 und 1 eingeschlossen).",
		"links": [{
			"id": 1088,
			"lang": "deu",
			"text": "Die Funktionen Sinus und Cosinus nehmen Werte zwischen -1 und 1 an (-1 und 1 eingeschlossen)."
		}, {
			"id": 4104,
			"lang": "fra",
			"text": "Les fonctions sinus et cosinus prennent des valeurs entre -1 et 1 (-1 et 1 inclus)."
		}, ...],
		"tags": ["maths", "mathematics"]
	}, ... (4 more entries)]

### Get sentence details
Get sentences by id.

**Route**: `GET /sentences/:id` (give a single id or a comma separated list)

**Parameters**: 
 - `links`: (optional) Each entry will contain a `links` array with all linked sentence objects with fields  `{id, lang, text}`
 - `tags`: (optional) Each entry will contain a `tags` array with the associated tag names

**Example**
`GET /sentences/42849,66989`
=>

	[{
		"id": 42849,
		"lang": "eng",
		"text": "What is it?"
	}, {
		"id": 66989,
		"lang": "eng",
		"text": "What's that?"
	}]


### Sentence search
Performs a fulltext search accross all sentences.

**Route**: `GET /sentences/search`

**Parameters**:
 - `q`: The search string
 - `lang`: (optional) A three character [language code](https://en.wikipedia.org/wiki/ISO_639-3). If specified, only sentences from that language get returned
 - `links`: (optional) Each entry will contain a `links` array with all linked sentence objects with fields  `{id, lang, text}`
 - `tags`: (optional) Each entry will contain a `tags` array with the associated tag names
 - `offset`: (optional) For paging, the starting entry
 - `limit`: (optional) For paging, the amount of entries. Maximum of 1000 and if the `links` parameter is specified, a maximum of 250

**Example**:
`GET /sentences/search?q=home&offset=1&limit=2`
=>

    [{
        "id": 5705234,
        "lang": "eng",
        "text": "I do come home at Christmas. We all do, or we all should. We all come home, or ought to come home, for a short holiday — the longer, the better — from the great boarding-school, where we are forever working at our arithmetical slates, to take, and give a rest."
    }, {
        "id": 36723,
        "lang": "eng",
        "text": "Be it ever so humble, home is home."
    }]
 



### List all tags
Returns a simple text list of tags used in the dataset.

**Route**: `GET /tags`

**Parameters**: -

**Example**:
`GET /tags`
=>

	["1 Corinthians 13:4-5", "1 syllable", "1 Timothy 6:10", "1 word", ...]

### Get the license
Returns the license of Tatoeba. This is a static result which never changes.

**Route**: `GET /license`

**Parameters**: -

**Example**: 
`GET /license`
=>

	{
		"nameShort": "CC BY 2.0",
		"nameLong": "Attribution 2.0 Generic (CC BY 2.0)",
		"urlOverview": "https://creativecommons.org/licenses/by/2.0/",
		"urlLicense": "https://creativecommons.org/licenses/by/2.0/legalcode"
	}

# Setup

This API bases on Node.js and MySQL, so you have to have those installed.

	# install necessities
	sudo apt-get install -y nodejs npm mysql-server mysql-client nginx sphinxsearch
	npm install pm2 -g

	# get repository
	mkdir -p /var/www/datahive/tatoeba
	cd /var/www/datahive/tatoeba
	git clone https://github.com/Badestrand/datahive-tatoeba.git .
	npm i
	mysql < config/setup-database.sql

	# import Tatoeba database from https://tatoeba.org/eng/downloads
	cd /tmp
	wget http://downloads.tatoeba.org/exports/sentences.tar.bz2 http://downloads.tatoeba.org/exports/links.tar.bz2 http://downloads.tatoeba.org/exports/tags.tar.bz2
	tar -xvjf sentences.tar.bz2
	tar -xvjf links.tar.bz2
	tar -xvjf tags.tar.bz2
	rm sentences.tar.bz2 links.tar.bz2 tags.tar.bz2
	mysqlimport --fields-terminated-by='\t' --local -u tatoeba -p --default-character-set=utf8 tatoeba /tmp/sentences.csv
	mysqlimport --fields-terminated-by='\t' --local -u tatoeba -p --default-character-set=utf8 tatoeba /tmp/links.csv
	mysqlimport --fields-terminated-by='\t' --local -u tatoeba -p --default-character-set=utf8 tatoeba /tmp/tags.csv

	# start sphinx search
	cd /var/www/datahive/tatoeba
	mkdir -p _platform/sphinxdata
	indexer --all --config config/sphinx.conf

	# start the server
	pm2 start server.js --name tatoeba --watch
	pm2 save

	# let pm2 process and sphinx survive a restart


Then, adjust the `/config.json` file to your needs.


Sphinx fulltext search commands:

	Create index: `indexer --all --config config/sphinx.conf`

	Rotate Index: `indexer --all --rotate --config config/sphinx.conf`

	Start Sphinx: `searchd --config config/sphinx.conf`

	Stop Sphinx: `searchd --stop --config config/sphinx.conf`
