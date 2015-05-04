'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _Stream = require('../stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _import = require('./common');

var _import2 = _interopRequireDefault(_import);

_Stream2['default'].domevent = function (target, event, untilP) {
  return _Stream2['default'].event(function (listener) {
    return target.addEventListener(event, listener);
  }, function (listener) {
    return target.removeEventListener(event, listener);
  }, untilP);
};