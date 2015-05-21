"use strict";

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _stream = require("./stream");

var _stream2 = _interopRequireDefault(_stream);

var _factoryCommon = require("./factory/common");

var _factoryCommon2 = _interopRequireDefault(_factoryCommon);

var _factoryServer = require("./factory/server");

var _factoryServer2 = _interopRequireDefault(_factoryServer);

var _factoryBrowser = require("./factory/browser");

var _factoryBrowser2 = _interopRequireDefault(_factoryBrowser);

var _utils = require("./utils");

var utils = _interopRequireWildcard(_utils);

module.exports = {
    Stream: _stream2["default"],
    utils: utils,
    $on: _stream2["default"].fromDomTarget,
    $once: utils.nextDOMEvent,
    $$: utils.$update
};