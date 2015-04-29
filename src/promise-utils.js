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