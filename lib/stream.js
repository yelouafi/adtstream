"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

// ADT definition
exports.Stream = Stream;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _adt = require("./adt");

var _adt2 = _interopRequireDefault(_adt);

var _utils = require("./utils");

var noop = function noop() {},
    undef = noop,
    eq = function eq(a, b) {
  return a === b;
},
    flip = function flip(f) {
  return function (y, x) {
    return f(x, y);
  };
},
    never = new Promise(noop);
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

// anError : Object
// aBool : Object (javascript truth)

// map : ( Stream a, a -> b | Promise b ) -> Stream b
Stream.prototype.map = function (f) {
  var tailM = undefined,
      futP = undefined;

  return this.isEmpty || this.isAbort ? this : this.isCons ? (tailM = this.tail.map(f), futP = Promise.resolve(f(this.head)).then(function (head) {
    return Stream.Cons(head, tailM);
  }, Stream.Abort), Stream.Future(futP)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.map(f);
  }, Stream.Abort));
};

// const : (Stream a, b) -> Stream b
Stream.prototype["const"] = function (val) {
  return this.map(function (_) {
    return val;
  });
};

// mapError : (Stream a, anError -> Stream a) -> Stream a
Stream.prototype.mapError = function (f) {

  return this.isEmpty ? this : this.isAbort ? f(this.error) : this.isCons ? Stream.Cons(this.head, this.tail.mapError(f)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.mapError(f);
  }, Stream.Abort));
};

// filter : (Stream a, a -> aBool | Promise aBool) -> Stream a
Stream.prototype.filter = function (p) {
  var _this = this;

  var tailF = undefined,
      futP = undefined;

  return this.isEmpty || this.isAbort ? this : this.isCons ? (tailF = this.tail.filter(p), futP = Promise.resolve(p(this.head)).then(function (ok) {
    return ok ? Stream.Cons(_this.head, tailF) : tailF;
  }, Stream.Abort), Stream.Future(futP)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.filter(p);
  }, Stream.Abort));
};

// length : Stream a => Promise Number
Stream.prototype.length = function () {
  return this.reduce(function (n, _) {
    return n + 1;
  }, 0);
};

// first : Stream a -> Stream a
Stream.prototype.first = function () {
  return this.isEmpty ? Promise.reject("Empty Stream") : this.isAbort ? Promise.reject(this.error) : this.isCons ? Promise.resolve(this.head) :

  /* isFuture */this.promise.then(function (s) {
    return s.first();
  }, Promise.reject);
};

// last : Stream a -> Stream a
Stream.prototype.last = function () {
  return this.reduce(function (_, cur) {
    return cur;
  });
};

// at : ( Stream a, Number ) -> Stream a
Stream.prototype.at = function (idx) {

  return this.isEmpty ? Promise.reject("Index too large") : idx < 0 ? Promise.reject("negative index") : this.isAbort ? Promise.reject(this.err) : this.isCons ? idx === 0 ? Promise.resolve(this.head) : this.tail.at(idx - 1) :

  // isFuture
  this.promise.then(function (s) {
    return s.at(idx);
  }, Stream.Abort);
};

// take : (Stream a, Number ) -> Stream a
Stream.prototype.take = function (n) {

  return this.isEmpty || n < 1 ? Stream.Empty : this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.take(n - 1)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.take(n);
  }, Stream.Abort));
};

// takeWhile : (Stream a, a -> aBool | Promise aBool) -> Stream a
Stream.prototype.takeWhile = function (p) {
  var _this2 = this;

  return this.isEmpty || this.isAbort ? this : this.isCons ? Stream.Future(Promise.resolve(p(this.head)).then(function (ok) {
    return ok ? Stream.Cons(_this2.head, _this2.tail.takeWhile(p)) : Stream.Empty;
  }, Stream.Abort)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.takeWhile(p);
  }, Stream.Abort));
};

// takeUntil  : (Stream a, Promise) -> Stream a
Stream.prototype.takeUntil = function (promise) {

  return this.isEmpty || this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.takeUntil(promise)) :

  // isFuture
  Stream.Future(_utils.raceL([promise.then(function (_) {
    return function () {
      return Stream.Empty;
    };
  }, Stream.Abort), this.promise.then(function (s) {
    return function () {
      return s.takeUntil(promise);
    };
  }, Stream.Abort)]));
};

// skip : (Stream a, n) -> Stream a
Stream.prototype.skip = function (n) {

  return this.isEmpty || this.isAbort || n < 1 ? this : this.isCons ? this.tail.skip(n - 1) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.skip(n);
  }, Stream.Abort));
};

// skipWhile : (Stream a, a -> aBool | Promise aBool) -> Stream a
Stream.prototype.skipWhile = function (p) {
  var _this3 = this;

  return this.isEmpty || this.isAbort ? this : this.isCons ? Stream.Future(Promise.resolve(p(this.head)).then(function (ok) {
    return ok ? _this3.tail.skipWhile(p) : _this3;
  }, Stream.Abort)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.skipWhile(p);
  }, Stream.Abort));
};

// skipUntil  : (Stream a, Promise) -> Stream a
Stream.prototype.skipUntil = function (promise) {
  var _this4 = this;

  return this.isEmpty || this.isAbort ? this : this.isCons ? this.tail.skipUntil(promise) :

  // isFuture
  Stream.Future(_utils.raceL([this.promise.then(function (s) {
    return function () {
      return s.skipUntil(promise);
    };
  }, Stream.Abort), promise.then(function (_) {
    return function () {
      return _this4;
    };
  }, Stream.Abort)]));
};

// span : (Stream a, a -> aBool | Promise aBool) -> [Stream a, Stream a]
Stream.prototype.span = function (p) {
  var _this5 = this;

  var s1, s2;
  return this.isEmpty || this.isAbort ? [this, this] : this.isCons ? splitP(Promise.resolve(p(this.head)).then(function (ok) {
    var _temp, _temp2;

    return ok ? ((_temp = _this5.tail.span(p), _temp2 = _slicedToArray(_temp, 2), s1 = _temp2[0], s2 = _temp2[1], _temp), [Stream.Cons(_this5.head, s1), s2]) : [Stream.Empty, _this5];
  }, Stream.Abort)) :

  // isFuture
  splitP(this.promise.then(function (s) {
    return s.span(p);
  }, Stream.Abort));

  function splitP(p) {
    return [Stream.Future(p.then(function (sp) {
      return sp[0];
    })), Stream.Future(p.then(function (sp) {
      return sp[1];
    }))];
  }
};

// break : (Stream a, a -> aBool | Promise aBool) -> [Stream a, Stream a]
Stream.prototype["break"] = function (p) {
  var _this6 = this;

  var s1, s2;
  return this.isEmpty || this.isAbort ? [this, this] : this.isCons ? splitP(Promise.resolve(p(this.head)).then(function (ok) {
    var _temp3, _temp32;

    return !ok ? ((_temp3 = _this6.tail["break"](p), _temp32 = _slicedToArray(_temp3, 2), s1 = _temp32[0], s2 = _temp32[1], _temp3), [Stream.Cons(_this6.head, s1), s2]) : [Stream.Empty, _this6];
  }, Stream.Abort)) :

  // isFuture
  splitP(this.promise.then(function (s) {
    return s["break"](p);
  }, Stream.Abort));

  function splitP(p) {
    return [Stream.Future(p.then(function (sp) {
      return sp[0];
    })), Stream.Future(p.then(function (sp) {
      return sp[1];
    }))];
  }
};

// groupBy : (Stream a, (a, a) -> aBool | Promise aBool) => Stream (Stream a)
Stream.prototype.groupBy = function (p) {
  var _this7 = this;

  var _temp4, _temp42;

  var s1, s2;

  return this.isEmpty || this.isAbort ? this : this.isCons ? ((_temp4 = this.tail.span(function (x) {
    return p(_this7.head, x);
  }), _temp42 = _slicedToArray(_temp4, 2), s1 = _temp42[0], s2 = _temp42[1], _temp4), Stream.Cons(Stream.Cons(this.head, s1), s2.groupBy(p))) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.groupBy(p);
  }, Stream.Abort));
};

// group : Stream a => Stream (Stream a)
Stream.prototype.group = function () {
  return this.groupBy(function (x1, x2) {
    return x1 === x2;
  });
};

// splitBy : (Stream a, a -> Stream a) -> Stream a
Stream.prototype.splitBy = function (f) {

  return this.isEmpty || this.isAbort ? this : this.isCons ? f(this.head).concat(this.tail.splitBy(f)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.splitBy(f);
  }, Stream.Abort));
};

// chunkBy : (Stream a, a -> [Stream a, a | Promise a]) -> Stream a
Stream.prototype.chunkBy = function (zero, f) {
  var chunks, residual;

  return go(zero, this);

  function go(acc, me) {
    var _temp5, _temp52;

    return me.isEmpty || me.isAbort ?
    // if we are left with a non-zero residual result yield it
    zero === acc ? this : Stream.Cons(acc, me) : me.isCons ? ((_temp5 = f(acc, me.head), _temp52 = _slicedToArray(_temp5, 2), chunks = _temp52[0], residual = _temp52[1], _temp5), chunks.concat(Stream.Future(Promise.resolve(residual).then(function (newAcc) {
      return go(newAcc, me.tail);
    }, Stream.Abort)))) :

    // isFuture
    Stream.Future(me.promise.then(function (s) {
      return go(acc, s);
    }, Stream.Abort));
  }
};

// reduce : ( Stream a, (b,a) -> b | Promise b, b | Promise b ) => Promise b
Stream.prototype.reduce = function (f) {
  var _this8 = this;

  var seed = arguments[1] === undefined ? undef : arguments[1];

  return this.isEmpty ? seed !== undef ? Promise.resolve(seed) : Promise.reject("Empty Stream") : this.isAbort ? Promise.reject(this.error) : this.isCons ? seed === undef ? this.tail.reduce(f, this.head) : Promise.resolve(seed).then(function (acc) {
    return _this8.tail.reduce(f, f(acc, _this8.head));
  }) :

  // isFuture
  this.promise.then(function (s) {
    return s.reduce(f, seed);
  });
};

// reduceRight : ( Stream a, (a,b) -> b | Promise b, b | Promise b ) => Promise b
Stream.prototype.reduceRight = function (f) {
  var _this9 = this;

  var seed = arguments[1] === undefined ? undef : arguments[1];

  return this.isEmpty ? seed !== undef ? Promise.resolve(seed) : Promise.reject("Empty Stream") : this.isAbort ? Promise.reject(this.error) : this.isCons ? seed === undef ? this.tail.reduceRight(f, this.head) : Promise.resolve(seed).then(function (acc) {
    return _this9.tail.reduceRight(f, acc);
  }).then(function (acc2) {
    return f(_this9.head, acc2);
  }) :

  // isFuture
  this.promise.then(function (s) {
    return s.reduceRight(f, seed);
  });
};

// scan : ( Stream a, (b, a) -> b | Promise b, b | Promise b ) -> Stream a
Stream.prototype.scan = function (f) {
  var _this10 = this;

  var seed = arguments[1] === undefined ? undef : arguments[1];

  var acc1 = undefined;

  return this.isEmpty || this.isAbort ? this : this.isCons ? seed === undef ? Stream.Cons(this.head, this.tail.scan(f, this.head)) : Stream.Future(Promise.resolve(seed).then(function (acc) {
    return (acc1 = f(acc, _this10.head), Stream.Cons(acc1, _this10.tail.scan(f, acc1)));
  }, Stream.Abort)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.scan(f, seed);
  }, Stream.Abort));
};

// window : ( Stream a, Number, Number ) -> Stream [a]
Stream.prototype.window = function (size) {
  var min = arguments[1] === undefined ? 0 : arguments[1];

  return this.scan(function (p, c) {
    return p.length < size ? [].concat(_toConsumableArray(p), [c]) : [].concat(_toConsumableArray(p.slice(1)), [c]);
  }, []).filter(function (arr) {
    return arr.length >= min;
  });
};

// changes : ( Stream a, (a,a) -> aBool ) -> Stream a
Stream.prototype.changes = function () {
  var f = arguments[0] === undefined ? eq : arguments[0];
  var last = arguments[1] === undefined ? undef : arguments[1];

  return this.isEmpty || this.isAbort ? this : this.isCons ? !f(this.head, last) ? Stream.Cons(this.head, this.tail.changes(f, this.head)) : this.tail.changes(f, this.head) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.changes(f, last);
  }, Stream.Abort));
};

// toArray : Stream a -> Promise [a]
Stream.prototype.toArray = function () {
  return this.reduce(function (xs, x) {
    return [].concat(_toConsumableArray(xs), [x]);
  }, []);
};

// all : ( Stream a, a -> aBool | Promise aBool ) => Promise Boolean
Stream.prototype.all = function (pred) {
  return this.reduce(function (prev, cur) {
    return Promise.resolve(pred(cur)).then(function (ok) {
      return prev && !!ok;
    }, Promise.reject);
  }, true);
};

// any : ( Stream a, a -> aBool | Promise aBool ) => Promise Boolean
Stream.prototype.any = function (pred) {
  var _this11 = this;

  return this.isEmpty ? Promise.resolve(false) : this.isAbort ? Promise.reject(this.err) : this.isCons ? Promise.resolve(pred(this.head).then(function (ok) {
    return ok || _this11.tail.any(pred);
  }), Stream.Abort) :

  /* isFuture */
  this.promise.then(function (s) {
    return s.any(pred);
  });
};

// join : ( Stream a, a) -> Stream a
Stream.prototype.join = function () {
  var sep = arguments[0] === undefined ? ", " : arguments[0];

  return this.reduce(function (prev, cur) {
    return prev + sep + cur;
  });
};

// concat : (Stream a, Stream a) -> Stream a
Stream.prototype.concat = function (s2) {

  return this.isEmpty ? s2 : this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.concat(s2)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.concat(s2);
  }, Stream.Abort));
};

// combineWith : (Stream a, Stream b, (a,b) -> c ) -> Stream c
Stream.prototype.combineWith = function (s2, f) {
  var _this12 = this;

  var latest1 = arguments[2] === undefined ? undef : arguments[2];
  var latest2 = arguments[3] === undefined ? undef : arguments[3];

  return this.isEmpty ? latest1 !== undef ? s2.map(function (x) {
    return f(latest1, x);
  }) : this : this.isAbort ? this : this.isCons ? latest2 !== undef ? Stream.Cons(f(this.head, latest2), this.tail.combineWith(s2, f, this.head, latest2)) : this.tail.combineWith(s2, f, this.head, latest2) : !s2.isFuture ? s2.combineWith(this, flip(f), latest2, latest1) : Stream.Future(_utils.raceL([this.promise.then(function (s) {
    return function () {
      return s.combineWith(s2, f, latest1, latest2);
    };
  }, Stream.Abort), s2.promise.then(function (s) {
    return function () {
      return s2.combineWith(_this12, flip(f), latest2, latest1);
    };
  }, Stream.Abort)]));
};

// combine : (Stream a, Stream b ) -> Stream [a,b]
Stream.prototype.combine = function (s2) {
  return this.combineWith(s2, function (x, y) {
    return [x, y];
  });
};

// Stream.combine : [Stream a] -> Stream [a]
Stream.combine = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return args.reduce(function (acc, s, i) {
    return i === 1 ? acc.combine(s) : acc.combineWith(s, function (arr, x) {
      return [].concat(_toConsumableArray(arr), [x]);
    });
  });
};

// merge : (Stream a, Stream a) -> Stream a
Stream.prototype.merge = function (s2) {
  var _this13 = this;

  return this.isEmpty ? s2 : this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.merge(s2)) : !s2.isFuture ? s2.merge(this) : Stream.Future(_utils.raceL([this.promise.then(function (s) {
    return function () {
      return s.merge(s2);
    };
  }, Stream.Abort), s2.promise.then(function (s) {
    return function () {
      return s.merge(_this13);
    };
  }, Stream.Abort)]));
};

// relay : (Stream a, Stream a) -> Stream a
Stream.prototype.relay = function (s2) {
  return this.takeUntil(s2.first()["catch"](function (_) {
    return never;
  })).concat(s2);
};

// zipWith : (Stream a, Stream b, (a,b) -> c) -> Stream c
Stream.prototype.zipWith = function (s2, f) {
  var _this14 = this;

  return this.isEmpty || this.isAbort ? this : s2.isEmpty || s2.isAbort ? s2 : this.isCons && s2.isCons ? Stream.Cons(f(this.head, s2.head), this.tail.zipWith(s2.tail, f)) : this.isCons && s2.isFuture ? Stream.Future(s2.promise.then(function (s) {
    return _this14.zipWith(s, f);
  }, Stream.Abort)) :

  // this.isFuture && (s2.isCons || s2.isFuture)
  Stream.Future(this.promise.then(function (s) {
    return s.zipWith(s2, f);
  }, Stream.Abort));
};

// zip : (Stream a, Stream b) -> Stream [a,b]
Stream.prototype.zip = function (s2) {
  return this.zipWith(s2, function (x, y) {
    return [x, y];
  });
};

// Stream.zip : [Stream a] -> Stream [a]
Stream.zip = function () {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return args.reduce(function (acc, s, i) {
    return i === 1 ? acc.zip(s) : acc.zipWith(s, function (arr, x) {
      return [].concat(_toConsumableArray(arr), [x]);
    });
  });
};

// flatten : ( Stream (Stream a), (Stream a, Stream a) -> Stream a) -> Stream a
Stream.prototype.flatten = function (f) {

  return this.isEmpty || this.isAbort ? this : this.isCons ? f(this.head, this.tail.flatten(f)) :

  // isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.flatten(f);
  }, Stream.Abort));
};

// mergeAll : Stream (Stream a) -> Stream a
Stream.prototype.mergeAll = function () {
  return this.flatten(function (s1, s2) {
    return s1.merge(s2);
  });
};

// concatAll : Stream (Stream a) -> Stream a
Stream.prototype.concatAll = function () {
  return this.flatten(function (s1, s2) {
    return s1.concat(s2);
  });
};

// relayAll : Stream (Stream a) -> Stream a
Stream.prototype.relayAll = function () {
  return this.flatten(function (s1, s2) {
    return s1.relay(s2);
  });
};

// mergeMap : (Stream a, a -> Stream b) -> Stream a
Stream.prototype.mergeMap = function (f) {
  return this.map(f).mergeAll();
};

// concatMap : (Stream a, a -> Stream b) -> Stream a
Stream.prototype.concatMap = function (f) {
  return this.map(f).concatAll();
};

// relayMap : (Stream a, a -> Stream b) -> Stream a
Stream.prototype.relayMap = function (f) {
  return this.map(f).relayAll();
};

// debounce : (Stream a, () => Promise) -> Stream a
Stream.prototype.debounce = function (event) {
  var _this15 = this;

  var last = arguments[1] === undefined ? undef : arguments[1];

  return this.isEmpty || this.isAbort ? last !== undef ? Stream.Cons(last, this) : this : this.isCons ? this.tail.debounce(event, this.head) : last === undef ? Stream.Future(this.promise.then(function (s) {
    return s.debounce(event);
  }, Stream.Abort)) : Stream.Future(_utils.raceL([event().then(function (_) {
    return function () {
      return Stream.Cons(last, _this15.debounce(event, undef));
    };
  }, Stream.Abort), this.promise.then(function (s) {
    return function () {
      return s.debounce(event, last);
    };
  }, Stream.Abort)]));
};

// throttle : (Stream a, () => Promise) -> Stream a
Stream.prototype.throttle = function (event) {

  return this.isEmpty || this.isAbort ? this : this.isCons ? Stream.Cons(this.head, this.tail.skipUntil(event()).throttle(event)) :

  // this.isFuture
  Stream.Future(this.promise.then(function (s) {
    return s.throttle(event);
  }, Stream.Abort));
};

// forEach : (Stream a, a -> (), a -> (), a -> ()) -> ()
Stream.prototype.forEach = function (onNext) {
  var onError = arguments[1] === undefined ? noop : arguments[1];
  var onComplete = arguments[2] === undefined ? noop : arguments[2];

  return this.isEmpty ? onComplete() : this.isAbort ? onError(this.error) : this.isCons ? (onNext(this.head), this.tail.forEach(onNext, onError, onComplete)) :

  /* isFuture */
  this.promise.then(function (stream) {
    return stream.forEach(onNext, onError, onComplete);
  }, onError);
};

// log : (Stream a, String) -> ()
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

/* this.isFuture */

// this.isFuture

// this.isFuture