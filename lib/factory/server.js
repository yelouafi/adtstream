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