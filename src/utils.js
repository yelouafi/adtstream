/*
the polyfill is used for Node verions that don't yet support Promises (like node 0.10.x versions)
- In the server, you can remove the 2 lines below if your environments includes native support for Promises
- In the browser build the polyfill is deactivated by default (see the browser field in package.json)
if you need to polyfill in the browser you can either :
  1- remove the "es6-promise": false from package.json
  2- use a compliant Promise/A+ library
*/

var es6Promise = require('es6-promise');
es6Promise.polyfill &&  es6Promise.polyfill();


// getLater : ( () -> a, Number ) -> Promise a
export function getLater(getter, delay) {
  return new Promise( 
    resolve => setTimeout( () => resolve( getter() ), delay )
  );
}

// delayed : (a, Number) -> Promise a
export function delay(val, millis) {
  return getLater( () => val, millis);
}
  
// [Promise () -> a] -> Promise a
export function raceL(promises) {
  return Promise.race(promises).then( lazy => lazy() );
}

// emitterOnce : ( EventEmitter, String, String) -> Promise a
export function emitterOnce(emitter, eventRes, eventRej) {
  var resP = new Promise( (res, _) => emitter.once( eventRes, res ) ),
      rejP = new Promise( (_, rej) => emitter.once( eventRej, rej ) );
  
  return Promise.race([resP, rejP]);
}

// deferred : () -> { resolve: a -> (), reject: a -> (), promise: Promise a }
export function deferred() {
  var def = {};
  def.promise = new Promise((res, rej) => {
    def.resolve = res;
    def.reject = rej;
  });
  return def;
}

var neverP = new Promise(() => {});

// never : () -> Promise
export function never() {
  return neverP;
}