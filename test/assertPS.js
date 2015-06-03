import { Stream, utils } from "../src"

var assert = require("assert")

// assertion on promise values
// assertion : (act, exp) -> Boolean
export function assertP(promise, assertion, msg) {
  return promise.then( val => assertion(val, msg), err => assert(false, err) )
}

assertP.equal = function(promise, exp, msg) {
  return assertP(promise, val => assert.equal(val, exp), msg);
}

assertP.gte = function(promise, exp, msg) {
  return assertP(promise, val => assert(val >= exp), msg);
}

assertP.deepEqual = function(promise, exp, debug) {
  return promise.then( val => {
    debug && console.log('actual', val, 'expected', exp)
    return assert.deepEqual(val, exp) 
  });
}

assertP.rejected = function(promise, expErr) {
  return promise.then( 
    val => assert(false, `promise resolved with ${val}, should be rejected`), 
    err => assert.equal(err, expErr)
  );
}
