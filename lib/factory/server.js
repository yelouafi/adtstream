'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Stream = require('../stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _emitterOnce = require('../utils');

var _import = require('./common');

var _import2 = _interopRequireDefault(_import);

_Stream2['default'].fromEmitter = function (emitter, event, untilP) {
  return _Stream2['default'].event(function (listener) {
    return emitter.on(event, listener);
  }, function (listener) {
    return emitter.removeListener(event, listener);
  }, untilP);
};

_Stream2['default'].fromReadable = function (readable) {
  return _Stream2['default'].nodeEvent(readable, 'data', _emitterOnce.emitterOnce(readable, 'end', 'error'));
};