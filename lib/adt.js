'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
function eachKey(obj, f) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) f(key, obj[key]);
  }
}

function adtcase(base, proto, key) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var inst = new base();
    eachKey(proto.apply(undefined, args), function (key, val) {
      inst[key] = val;
    });
    inst['is' + key] = true;
    return inst;
  };
}

function adt(base, variants) {
  eachKey(variants, function (key, v) {
    if (typeof v === 'function') base[key] = adtcase(base, v, key);else {
      base[key] = v;
      v['is' + key] = true;
    }
  });
}

exports['default'] = adt;
module.exports = exports['default'];