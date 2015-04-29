'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

// getLater : ( () -> a, Number ) -> Promise a
exports.getLater = getLater;

// [Promise () -> a, ...] -> Promise a
exports.raceLP = raceLP;
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