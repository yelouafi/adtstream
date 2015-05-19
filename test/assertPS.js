import { Stream, utils } from "../src"

var assert = require("assert")

// create a stream that yields elements of 'arr' startting from 'delay', at each 'interval'
// Aborts at the end of the array
export function abortedSeq(arr, delay, interval) {
  return from(0, delay);
  
  function from(index, millis) {
    
    var getter = () =>
        index < arr.length ? 
          Stream.Cons( arr[index], from(index+1, interval) ) : 
          Stream.Abort('aborted seq!');
        
    return Stream.Future( utils.getLater(getter, millis) );
  }
}

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

assertP.deepEqual = function(promise, exp, msg) {
  return assertP(promise, val => assert.deepEqual(val, exp), msg);
}

assertP.rejected = function(promise) {
  return promise.then( 
    val => assert(false, `promise resolved with ${val}, should be rejected`), 
    err => assert(true)
  );
}
