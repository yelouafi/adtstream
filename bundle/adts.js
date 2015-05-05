(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.adts = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{"../stream":6,"./common":4}],4:[function(require,module,exports){
"use strict";

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _Stream = require("../stream");

var _Stream2 = _interopRequireDefault(_Stream);

var _getLater$raceLP$deferred = require("../utils");

function noop() {}

/* factory methods common to server and browser environments */

// array : [a] -> Stream a
_Stream2["default"].array = function (arr) {

  return from(0);

  function from(index) {
    return index < arr.length ? _Stream2["default"].Cons(arr[index], from(index + 1)) : _Stream2["default"].Empty;
  }
};

// seq : ([a], Number, Number) -> Stream a
_Stream2["default"].seq = function (arr, delay, interval) {
  return from(0, delay);

  function from(index, millis) {

    var getter = function getter() {
      return index < arr.length ? _Stream2["default"].Cons(arr[index], from(index + 1, interval)) : _Stream2["default"].Empty;
    };

    return _Stream2["default"].Future(_getLater$raceLP$deferred.getLater(getter, millis));
  }
};

// range : (Number, Number, Number, Number) -> Stream Number
_Stream2["default"].range = function (min, max, delay, interval) {
  return from(min, delay);

  function from(index, millis) {

    var getter = function getter() {
      return index <= max ? _Stream2["default"].Cons(index, from(index + 1, interval)) : _Stream2["default"].Empty;
    };

    return _Stream2["default"].Future(_getLater$raceLP$deferred.getLater(getter, millis));
  }
};

// cps a : ( a -> () ) -> ()
// event : (cps a, cps a, Promise a) -> Stream a
_Stream2["default"].event = function (sub, unsub, untilP) {
  var events = [],
      defs = [];
  var res = sub(slot);
  unsub = unsub || res || noop;
  return next();

  function next() {
    var nextE = nextEvent(),
        onErr = function onErr(err) {
      return function () {
        unsub(slot);return _Stream2["default"].Abort(err);
      };
    },
        nextP = !untilP ? nextE.then(function (v) {
      return _Stream2["default"].Cons(v, next());
    }, _Stream2["default"].Abort) : _getLater$raceLP$deferred.raceLP([untilP.then(function (_) {
      return function () {
        unsub(slot);return _Stream2["default"].Empty;
      };
    }, onErr), nextE.then(function (v) {
      return function () {
        return _Stream2["default"].Cons(v, next());
      };
    }, onErr)]);
    return _Stream2["default"].Future(nextP);
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
    if (events.length) {
      return Promise.resolve(events.shift());
    }var def = _getLater$raceLP$deferred.deferred();
    defs.push(def);
    return def.promise;
  }
};

},{"../stream":6,"../utils":7}],5:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (typeof obj === "object" && obj !== null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } };

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _Stream = require("./stream");

var _Stream2 = _interopRequireDefault(_Stream);

var _ = require("./factory/common");

var _3 = _interopRequireDefault(_);

var _4 = require("./factory/server");

var _5 = _interopRequireDefault(_4);

var _6 = require("./factory/browser");

var _7 = _interopRequireDefault(_6);

var _import = require("./utils");

var utils = _interopRequireWildcard(_import);

module.exports = {
    Stream: _Stream2["default"],
    utils: utils
};

},{"./factory/browser":3,"./factory/common":4,"./factory/server":1,"./stream":6,"./utils":7}],6:[function(require,module,exports){
"use strict";

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

// ADT definition
exports.Stream = Stream;

var _adt = require("./adt");

var _adt2 = _interopRequireDefault(_adt);

var _raceLP = require("./utils");

var noop = function noop() {},
    undef = noop,
    constt = function constt(v) {
  return function () {
    return v;
  };
};
function Stream() {}

_adt2["default"](Stream, {
  Empty: new Stream(),
  Abort: function Abort(error) {
    return { error: error };
  },
  Future: function Future(promise) {
    return { promise: promise };
  },
  Cons: function Cons(head, tail) {
    return { head: head, tail: tail };
  }
});

// map : (Stream a, a -> b) => Stream b
Stream.prototype.map = function (f) {
  return this.isEmpty || this.isAbort ? this : this.isCons ? Stream.Cons(f(this.head), this.tail.map(f)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.map(f);
  }, Stream.Abort));
};

// anError : Object
// mapError : (Stream a, anError -> Stream a) => Stream a
Stream.prototype.mapError = function (f) {
  return this.isEmpty ? this : this.isAbort ? f(this.error) : this.isCons ? Stream.Cons(this.head, this.tail.mapError(f)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.mapError(f);
  }, Stream.Abort));
};

// async map
// asyncMap : ( Stream a, a -> Promise a ) => Stream a
Stream.prototype.asyncMap = function (f) {
  var _this2 = this;

  return this.isEmpty || this.isAbort ? this : this.isCons ? Stream.Future(f(this.head).then(function (h) {
    return Stream.Cons(h, _this2.tail.asyncMap(f));
  }, Stream.Abort)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.asyncMap(f);
  }, Stream.Abort));
};

// async map
// asyncMapError : ( Stream a, anError -> Promise (Stream a) ) => Stream a
Stream.prototype.asyncMapError = function (f) {
  return this.asyncMap(function (err) {
    return Stream.Future(f(err));
  });
};

// length : Stream a => Promise Number
Stream.prototype.length = function () {
  return this.isEmpty || this.isAbort ? Promise.resolve(0) : this.isCons ? this.tail.length().then(function (len) {
    return len + 1;
  }) :

  /* isFuture */this.promise.then(function (s) {
    return s.length();
  }, Promise.resolve(0));
};

// first : Stream a => Promise a
Stream.prototype.first = function () {
  return this.isEmpty ? Promise.reject("Stream.first: Empty Stream!") : this.isAbort ? Promise.reject(this.error) : this.isCons ? Promise.resolve(this.head) :

  /* isFuture */this.promise.then(function (s) {
    return s.first();
  }, Promise.reject);
};

// last : Stream a => Promise a
Stream.prototype.last = function () {

  return go(undef, this);

  function go(_x3, _x4) {
    var _again = true;

    _function: while (_again) {
      _again = false;
      var prec = _x3,
          me = _x4;
      if (me.isEmpty) {
        return prec !== undef ? Promise.resolve(prec) : Promise.reject("Stream.last: Empty Stream!");
      } else {

        if (me.isAbort) {
          return Promise.reject(me.error);
        } else {

          if (me.isCons) {
            _x3 = me.head;
            _x4 = me.tail;
            _again = true;
            continue _function;
          } else {
            return (

              /* isFuture */me.promise.then(function (s) {
                return go(prec, s);
              }, Promise.reject)
            );
          }
        }
      }
    }
  }
};

// at : Stream a => Promise a
Stream.prototype.at = function (idx) {
  return this.isEmpty || idx < 0 ? Promise.reject("Stream.at : End of Stream!") : this.isAbort ? Promise.reject(this.err) : this.isCons ? idx === 0 ? Promise.resolve(this.head) : this.tail.at(idx - 1) :

  // isFuture
  this.promise.then(function (s) {
    return s.at(idx);
  }, Stream.Abort);
};

// take : (Stream a, n) => Stream a
Stream.prototype.take = function (n) {
  return this.isEmpty || n < 1 ? Stream.Empty : this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.take(n - 1)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.take(n);
  }, Stream.Abort));
};

// aBoolean : Object (javascript truth)
// takeWile : (Stream a, a -> aBoolean) => Stream a
Stream.prototype.takeWhile = function (p) {
  return this.isEmpty || this.isAbort ? this : this.isCons ? p(this.head) ? Stream.Cons(this.head, this.tail.takeWhile(p)) : Stream.Empty :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.takeWhile(p);
  }, Stream.Abort));
};

// takeUntil  : (Stream a, Promise) => Stream a
Stream.prototype.takeUntil = function (promise) {
  return this.isEmpty || this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.takeUntil(promise)) :

  // isFuture
  Stream.Future(_raceLP.raceLP([promise.then(function (_) {
    return function () {
      return Stream.Empty;
    };
  }, Stream.Abort), this.promise.then(function (s) {
    return function () {
      return s.takeUntil(promise);
    };
  }, Stream.Abort)]));
};

// skip : (Stream a, n) => Stream a
Stream.prototype.skip = function (n) {
  return this.isEmpty || this.isAbort || n < 1 ? this : this.isCons ? this.tail.skip(n - 1) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.skip(n);
  }, Stream.Abort));
};

// aBoolean : Object (javascript truth)
// skipWhile : (Stream a, a -> aBoolean) => Stream a
Stream.prototype.skipWhile = function (p) {
  return this.isEmpty || this.isAbort ? this : this.isCons ? p(this.head) ? this.tail.skipWhile(p) : this :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.skipWhile(p);
  }, Stream.Abort));
};

// skipUntil  : (Stream a, Promise) => Stream a
Stream.prototype.skipUntil = function (promise) {
  var _this3 = this;

  return this.isEmpty || this.isAbort ? this : this.isCons ? this.tail.skipUntil(promise) :

  // isFuture
  Stream.Future(_raceLP.raceLP([this.promise.then(function (s) {
    return function () {
      return s.skipUntil(promise);
    };
  }, Stream.Abort), promise.then(function (_) {
    return function () {
      return _this3;
    };
  }, Stream.Abort)]));
};

// aBoolean : Object (javascript truth)
// filter : (Stream a, a -> aBoolean) => Stream a
Stream.prototype.filter = function (p) {
  return this.isEmpty || this.isAbort ? this : this.isCons ? p(this.head) ? Stream.Cons(this.head, this.tail.filter(p)) : this.tail.filter(p) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.filter(p);
  }, Stream.Abort));
};

// span : (Stream a, a -> aBoolean) -> [Stream a, Stream a]
Stream.prototype.span = function (p) {
  if (this.isEmpty || this.isAbort) return [this, this];

  if (this.isCons) {
    if (p(this.head)) {
      var res = this.tail.span(p);
      return [Stream.Cons(this.head, res[0]), res[1]];
    } else return [Stream.Empty, this];
  }

  // isFuture
  var futSpan = this.promise.then(function (s) {
    return s.span(p);
  }, Stream.Abort);
  return [Stream.Future(futSpan.then(function (sp) {
    return sp[0];
  })), Stream.Future(futSpan.then(function (sp) {
    return sp[1];
  }))];
};

// groupBy : (Stream a, (a, a) -> aBoolean) => Stream (Stream a)
Stream.prototype.groupBy = function (p) {
  var _this4 = this;

  if (this.isEmpty || this.isAbort) return this;

  if (this.isCons) {
    var span = this.tail.span(function (x) {
      return p(_this4.head, x);
    });
    return Stream.Cons(Stream.Cons(this.head, span[0]), span[1].groupBy(p));
  }

  // isFuture
  return Stream.Future(this.promise.then(function (s) {
    return s.groupBy(p);
  }, Stream.Abort));
};

// group : Stream a => Stream (Stream a)
Stream.prototype.group = function () {
  return this.groupBy(function (x1, x2) {
    return x1 === x2;
  });
};

// splitBy : (Stream a, a -> Stream a) => Stream a
Stream.prototype.splitBy = function (f) {
  return this.isEmpty || this.isAbort ? this : this.isCons ? f(this.head).concat(this.tail.splitBy(f)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.splitBy(f);
  }, Stream.Abort));
};

// chunkBy : (Stream a, a -> [Stream a, Promise a]) => Stream a
Stream.prototype.chunkBy = function (zero, f) {

  return go(zero, this);

  function go(acc, me) {
    //console.log('acc', acc, ' isEmpty ? ', !!me.isEmpty)
    if (me.isEmpty || me.isAbort) {
      return zero === acc ? this : Stream.Cons(acc, me);
    }if (me.isCons) {
      var res = f(acc, me.head);
      return res[0].concat(Stream.Future(res[1].then(function (newSeed) {
        return go(newSeed, me.tail);
      }, Stream.Abort)));
    }

    // isFuture
    return Stream.Future(me.promise.then(function (s) {
      return go(acc, s);
    }, Stream.Abort));
  }
};

// reduce : ( b, Stream a, (b, a) -> a ) => Promise b
Stream.prototype.reduce = function (seed, f) {
  return this.isEmpty ? Promise.resolve(seed) : this.isAbort ? Promise.reject(this.error) : this.isCons ? this.tail.reduce(f(seed, this.head), f) :

  // isFuture
  this.promise.then(function (s) {
    return s.reduce(seed, f);
  }, Promise.reject);
};

// toArray : Stream a -> Promise [a]
Stream.prototype.toArray = function () {
  return this.reduce([], function (xs, x) {
    return xs.concat(x);
  });
};

// all : ( Stream a, a -> aBoolean ) => Promise Boolean
Stream.prototype.all = function (pred) {
  return this.reduce(true, function (prev, cur) {
    return prev && !!pred(cur);
  });
};

// any : ( Stream a, a -> aBoolean ) => Promise Boolean
Stream.prototype.any = function (pred) {
  return this.reduce(false, function (prev, cur) {
    return prev || !!pred(cur);
  });
};

// concat : (Stream a, Stream a) => Stream a
Stream.prototype.concat = function (s2) {
  return this.isEmpty ? s2 : this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.concat(s2)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.concat(s2);
  }, Stream.Abort));
};

// merge : (Stream a, Stream a) => Stream a
Stream.prototype.merge = function (s2) {
  var _this5 = this;

  return this.isEmpty ? s2 : this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.merge(s2)) : !s2.isFuture ? s2.merge(s1) : Stream.Future(_raceLP.raceLP([this.promise.then(function (s) {
    return function () {
      return s.merge(s2);
    };
  }, Stream.Abort), s2.promise.then(function (s) {
    return function () {
      return s.merge(_this5);
    };
  }, Stream.Abort)]));
};

// flatten : Stream (Stream a) => Stream a
Stream.prototype.flatten = function () {

  return this.isEmpty || this.isAbort ? this : this.isCons ? this.head.merge(this.tail.flatten()) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.flatten();
  }, Stream.Abort));
};

// flatMap : (Stream a, a -> Stream b) => Stream b
Stream.prototype.flatMap = function (f) {
  return this.map(f).flatten();
};

// zip : (Stream a, Stream b) => Stream [a,b]
Stream.prototype.zip = function (s2) {
  var _this6 = this;

  return this.isEmpty || this.isAbort ? this : this.isCons ? s2.isCons ? Stream.Cons([this.head, s2.head], this.tail.zip(s2.tail)) : s2.isFuture ? s2.promise.then(function (s) {
    return _this6.zip(s);
  }, Stream.Abort) :
  // s2.isEmpty || s2.isAbort
  s2 :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.zip(s2);
  }, Stream.Abort));
};

// zipWith : (Stream a, Stream b, (a, b) -> c) => Stream c
Stream.prototype.zipWith = function (s2, f) {
  return this.zip(s2).map(function (pair) {
    return f.apply(null, pair);
  });
};

Stream.prototype.forEach = function (onNext) {
  var onError = arguments[1] === undefined ? noop : arguments[1];
  var onComplete = arguments[2] === undefined ? noop : arguments[2];

  if (this.isEmpty) onComplete();

  if (this.isAbort) onError(this.error);

  if (this.isCons) {
    onNext(this.head);
    this.tail.forEach(onNext, onError, onComplete);
  }

  if (this.isFuture) this.promise.then(function (stream) {
    return stream.forEach(onNext, onError, onComplete);
  }, onError);
};

Stream.prototype.log = function (prefix) {
  this.forEach(function (v) {
    return console.log(prefix, " data :", v);
  }, function (err) {
    return console.log(prefix, " error :", err);
  }, function () {
    return console.log(prefix, " end.");
  });
};

exports["default"] = Stream;

// this.isFuture

},{"./adt":2,"./utils":7}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

// getLater : ( () -> a, Number ) -> Promise a
exports.getLater = getLater;

// [Promise () -> a, ...] -> Promise a
exports.raceLP = raceLP;
exports.emitterOnce = emitterOnce;
exports.deferred = deferred;
exports.never = never;
// the shim is used for Node verions that don't yet support Promises
// in iojs or latest Node version with --harmony flags you can remove the following 2 lines
// in browser builds the shim is deactivated by default (see the browser field in package.json)
// if you need to shim in the browser
// you can either remove the "es6-promise": false from package.json or use a compliant Promise/A+ library
var es6Promise = require('es6-promise');
es6Promise.polyfill && es6Promise.polyfill();
function getLater(getter, delay) {
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(getter());
    }, delay);
  });
}

function raceLP(promises) {
  return Promise.race(promises).then(function (lazy) {
    return lazy();
  });
}

function emitterOnce(emitter, eventRes, eventRej) {
  var resP = new Promise(function (res, _) {
    return emitter.once(eventRes, res);
  }),
      rejP = new Promise(function (_, rej) {
    return emitter.once(eventRej, rej);
  });

  return Promise.race([resP, rejP]);
}

function deferred(name) {
  var def = { name: name };
  def.promise = new Promise(function (res, rej) {
    def.resolve = res;
    def.reject = rej;
  });
  //def.promise.then( _  => console.log(name, ' resolved') )
  return def;
}

var neverP = new Promise(function () {});

function never() {
  return neverP;
}

},{"es6-promise":1}]},{},[5])(5)
});