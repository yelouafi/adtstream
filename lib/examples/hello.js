'use strict';

var Stream = require('../stream').Stream;

Stream.seq(['Hello', 'ADT', 'Streams'], 0, 1000).log();