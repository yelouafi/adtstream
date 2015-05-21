'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

// getLater : ( () -> a, Number ) -> Promise a
exports.getLater = getLater;

// delayed : (a, Number) -> Promise a
exports.delay = delay;

// [Promise () -> a] -> Promise a
exports.raceL = raceL;

// emitterOnce : ( EventEmitter, String, String) -> Promise a
exports.emitterOnce = emitterOnce;

// deferred : () -> { resolve: a -> (), reject: a -> (), promise: Promise a }
exports.deferred = deferred;

// never : () -> Promise
exports.never = never;
/*
the polyfill is used for Node verions that don't yet support Promises (like node 0.10.x versions)
- In the server, you can remove the 2 lines below if your environments includes native support for Promises
- In the browser build the polyfill is deactivated by default (see the browser field in package.json)
if you need to polyfill in the browser you can either :
  1- remove the "es6-promise": false from package.json
  2- use a compliant Promise/A+ library
*/

var es6Promise = require('es6-promise');
es6Promise.polyfill && es6Promise.polyfill();
function getLater(getter, delay) {
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(getter());
    }, delay);
  });
}

function delay(val, millis) {
  return getLater(function () {
    return val;
  }, millis);
}

function raceL(promises) {
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

function deferred() {
  var def = {};
  def.promise = new Promise(function (res, rej) {
    def.resolve = res;
    def.reject = rej;
  });
  return def;
}

var neverP = new Promise(function () {});
function never() {
  return neverP;
}