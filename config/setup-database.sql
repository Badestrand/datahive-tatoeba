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
CREATE USER 'sphinxsearch'@'localhost' IDENTIFIED BY 'tatoeba';

GRANT ALL ON tatoeba.* TO 'tatoeba'@'localhost';
GRANT SELECT ON tatoeba.sentences TO 'sphinxsearch'@'localhost';