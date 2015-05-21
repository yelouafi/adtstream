'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _stream = require('../stream');

var _stream2 = _interopRequireDefault(_stream);

var _utils = require('../utils');

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

_stream2['default'].fromEmitter = function (emitter, event, untilP) {
  return _stream2['default'].bind(function (listener) {
    return emitter.on(event, listener);
  }, function (listener) {
    return emitter.removeListener(event, listener);
  }, untilP);
};

_stream2['default'].fromReadable = function (readable) {
  return _stream2['default'].fromEmitter(readable, 'data', _utils.emitterOnce(readable, 'end', 'error'));
};

var Readable = require('stream').Readable,
    util = require('util');

util.inherits(ReadableAdts, Readable);

function ReadableAdts(adts, opt) {
  Readable.call(this, opt);
  this.adts = adts;
}

ReadableAdts.prototype._read = function () {
  var me = this;
  read();

  function read() {
    if (me.adts.isEmpty) return me.push(null);

    if (me.adts.isAbort) me.emit('error', me.adts.error);

    if (me.adts.isCons) {
      var head = me.adts.head;
      me.adts = me.adts.tail;
      me.push(head);
    }

    if (me.adts.isFuture) {
      me.adts.promise.then(function (s) {
        me.adts = s;
        read();
      });
    }
  }
};

_stream2['default'].prototype.toReadable = function (opt) {
  var r = new ReadableAdts(this, opt);
  r.setEncoding('utf8');
  return r;
};