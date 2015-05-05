'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _stream = require('../stream');

var _stream2 = _interopRequireDefault(_stream);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

_stream2['default'].domevent = function (target, event, untilP) {
  return _stream2['default'].event(function (listener) {
    return target.addEventListener(event, listener);
  }, function (listener) {
    return target.removeEventListener(event, listener);
  }, untilP);
};