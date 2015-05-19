import Stream from "../stream"
import { getLater, delayed, raceLP, deferred } from "../utils"

function noop() {}

/* factory methods common to server and browser environments */

// array : [a] -> Stream a
Stream.array = function(arr) {
  
  return from(0);
  
  function from(index) {
    return index < arr.length ? 
      Stream.Cons(arr[index], from(index+1)) :
      Stream.Empty;
  }
}

// seq : ([a], Number, Number) -> Stream a
Stream.seq = function(arr, delay, interval) {
  return from(0, delay);
  
  function from(index, millis) {
    
    var getter = () =>
        index < arr.length ? 
          Stream.Cons( arr[index], from(index+1, interval) ) : 
          Stream.Empty;
        
    return Stream.Future( getLater(getter, millis) );
  }
}

// occs : ([(a, Number)]) -> Stream a
Stream.occs = function(occs) {
  var arrP = occs.map( o => delayed(o[0], o[1])  );
  return from(0);
  
  function from(index) {
    let op;
    return index < arrP.length ? 
      ( op = arrP[index],
        Stream.Future( op.then( v => Stream.Cons(v, from(index+1)), Stream.Abort ) )
      ) :
      Stream.Empty;
  }
}

// range : (Number, Number, Number, Number) -> Stream Number
Stream.range = function(min, max, delay, interval) {
  return from(min, delay);
  
  function from(index, millis) {
    
    var getter = () =>
        index <= max ? 
          Stream.Cons( index, from(index+1, interval) ) : 
          Stream.Empty;
        
    return Stream.Future( getLater(getter, millis) );
  }
}

// cps a : ( a -> () ) -> ()
// event : (cps a, cps a, Promise a) -> Stream a
Stream.bind = function(sub, unsub, untilP) {
  var events = [], defs = [];
  var res = sub(slot);
  unsub = unsub || res || noop;
  return next();
  
  function next() {
    var nextE = nextEvent(),
        onErr = err => () => { unsub(slot); return Stream.Abort(err) },
        nextP = !untilP ?
          nextE.then( v => Stream.Cons(v, next() ), Stream.Abort ) :
          raceLP([
            untilP.then( _ => () => { unsub(slot); return Stream.Empty; }, onErr ),
            nextE.then( v => () => Stream.Cons(v, next()), onErr )
          ])
    return Stream.Future(nextP)
  }
  
  function slot(...args) {
    //console.log('new event')
    var val = args.length > 1 ? args : args[0];
    if(defs.length)
      defs.shift().resolve(val);
    else
      events.push(val);
  }
  function nextEvent() {
    if(events.length)
      return Promise.resolve(events.shift());
    var def = deferred();
    defs.push(def);
    return def.promise;
  }
  
}