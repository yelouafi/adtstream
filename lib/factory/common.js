"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _stream = require("../stream");

var _stream2 = _interopRequireDefault(_stream);

var _utils = require("../utils");

function noop() {}

/* factory methods common to server and browser environments */

// array : [a] -> Stream a
_stream2["default"].array = function (arr) {

  return from(0);

  function from(index) {
    return index < arr.length ? _stream2["default"].Cons(arr[index], from(index + 1)) : _stream2["default"].Empty;
  }
};

// seq : ([a], Number, Number) -> Stream a
_stream2["default"].seq = function (arr, delay, interval) {
  return from(0, delay);

  function from(index, millis) {

    var getter = function getter() {
      return index < arr.length ? _stream2["default"].Cons(arr[index], from(index + 1, interval)) : _stream2["default"].Empty;
    };

    return _stream2["default"].Future(_utils.getLater(getter, millis));
  }
};

// range : (Number, Number, Number, Number) -> Stream Number
_stream2["default"].range = function (min, max, delay, interval) {
  return from(min, delay);

  function from(index, millis) {

    var getter = function getter() {
      return index <= max ? _stream2["default"].Cons(index, from(index + 1, interval)) : _stream2["default"].Empty;
    };

    return _stream2["default"].Future(_utils.getLater(getter, millis));
  }
};

// cps a : ( a -> () ) -> ()
// event : (cps a, cps a, Promise a) -> Stream a
_stream2["default"].event = function (sub, unsub, untilP) {
  var events = [],
      defs = [];
  var res = sub(slot);
  unsub = unsub || res || noop;
  return next();

  function next() {
    var nextE = nextEvent(),
        onErr = function onErr(err) {
      return function () {
        unsub(slot);return _stream2["default"].Abort(err);
      };
    },
        nextP = !untilP ? nextE.then(function (v) {
      return _stream2["default"].Cons(v, next());
    }, _stream2["default"].Abort) : _utils.raceLP([untilP.then(function (_) {
      return function () {
        unsub(slot);return _stream2["default"].Empty;
      };
    }, onErr), nextE.then(function (v) {
      return function () {
        return _stream2["default"].Cons(v, next());
      };
    }, onErr)]);
    return _stream2["default"].Future(nextP);
  }

  function slot() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    //console.log('new event')
    var val = args.length > 1 ? args : args[0];
    if (defs.length) defs.shift().resolve(val);else events.push(val);
  }
  function nextEvent() {
    if (events.length) return Promise.resolve(events.shift());
    var def = _utils.deferred();
    defs.push(def);
    return def.promise;
  }
};