// the shim is used for Node verions that don't yet support Promises
// in iojs or latest Node version with --harmony flags you can remove the following 2 lines
// in browser builds the shim is deactivated by default (see the browser field in package.json)
// if you need to shim in the browser
// you can either remove the "es6-promise": false from package.json or use a compliant Promise/A+ library
var es6Promise = require('es6-promise');
es6Promise.polyfill &&  es6Promise.polyfill();


// getLater : ( () -> a, Number ) -> Promise a
export function getLater(getter, delay) {
  return new Promise( 
    resolve => setTimeout( () => resolve( getter() ), delay )
  );
}
  
// [Promise () -> a, ...] -> Promise a
export function raceLP(promises) {
  return Promise.race(promises).then( function(lazy) {
    return lazy();
  });
}

export function emitterOnce(emitter, eventRes, eventRej) {
  var resP = new Promise( (res, _) => emitter.once( eventRes, res ) ),
      rejP = new Promise( (_, rej) => emitter.once( eventRej, rej ) );
  
  return Promise.race([resP, rejP]);
}

export function deferred(name) {
  var def = { name: name };
  def.promise = new Promise((res, rej) => {
    def.resolve = res;
    def.reject = rej;
  });
  //def.promise.then( _  => console.log(name, ' resolved') )
  return def;
}

var neverP = new Promise(() => {})
export function never() {
  return neverP;
}