
# Overview

This is an unofficial REST API for the [Tatoeba project](https://tatoeba.org/). Tatoeba is a large database of sentences and translations, founded by Trang Ho in 2006. Its content is ever-growing and results from the voluntary contributions of thousands of members.

This API does not contain the data itself (download from [here](https://tatoeba.org/eng/downloads)) and is hosted by [datahive.one](https://datahive.one/) free for use but can just as well be self-hosted. Tatoebas data is licensed under the [Attribution 2.0 Generic (CC BY 2.0)](https://creativecommons.org/licenses/by/2.0/).

The routes, their parameters and result layouts are probably not completely stable as this is the first draft of the API. Feel free to contribute and open tickets.

Next enhancements:
 - Include a full text search
 - Include "Sentences with audio" from https://tatoeba.org/eng/downloads
 - Include User Lists from https://tatoeba.org/eng/downloads
 - Include Extended Sentence Info (username, date added, date modified) from https://tatoeba.org/eng/downloads

# API

## Authentication
If the `api.auth.validator` field in the configuration is specified then the API will require a http basic authentication header that gets validated with a post request to that `api.auth.validator` uri.

## Error handling
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

To set up the database:

	CREATE SCHEMA tatoeba CHARACTER SET utf8 COLLATE utf8_general_ci;
	CREATE TABLE tatoeba.links (
		`sentence_id_1` int(11) NOT NULL,
		`sentence_id_2` int(11) NOT NULL,
		KEY `links_sentence_id_1` (`sentence_id_1`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
	CREATE TABLE tatoeba.sentences (
		`id` int(11) NOT NULL,
		`lang` char(3) NOT NULL,
		`text` text NOT NULL,
		PRIMARY KEY (`id`),
		KEY `sentences_lang` (`lang`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
	CREATE TABLE tatoeba.tags (
		`sentence_id` int(11) NOT NULL,
		`tag` varchar(45) NOT NULL,
		KEY `tags_sentence_id` (`sentence_id`),
		KEY `tags_tag` (`tag`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
	CREATE USER 'tatoeba'@'localhost' IDENTIFIED BY 'tatoeba';
	GRANT ALL ON tatoeba.* TO 'tatoeba'@'localhost';

Import the database tables from [here](https://tatoeba.org/eng/downloads) by

	mysqlimport --fields-terminated-by='\t' --local -u root --default-character-set=utf8 tatoeba sentences.csv
	mysqlimport --fields-terminated-by='\t' --local -u root --default-character-set=utf8 tatoeba link.csv
	mysqlimport --fields-terminated-by='\t' --local -u root --default-character-set=utf8 tatoeba tags.csv

Then, adjust the `/config.json` file to your needs.