import Stream from "../stream";
import { getLater, delayed, raceL, deferred } from "../utils";

function noop() {}

// unit : a -> Stream a
Stream.unit = v => Stream.Cons(v, Stream.Empty );

// array : [a] -> Stream a
Stream.array = function(arr) {
  
  return from(0);
  
  function from(index) {
    return index < arr.length ? 
      Stream.Cons(arr[index], from(index+1)) :
      Stream.Empty;
  }
};

// timer : ( Number, count ) -> Stream Number
Stream.timer = function (interval, count) {
  let iv, clear, p = new Promise(res => clear = res);
  return Stream.bind(
    cb => iv = setInterval( () => {
      cb(Date.now());
      if(!--count) clear();
    }, interval),
    () => clearInterval(iv),
    p
  );
};

// timer : ( Number, count ) -> Stream Number
Stream.seconds = function (count) {
  let now = Date.now();
  return Stream.Cons(0, Stream.timer(1000, count).map(t => Math.floor((t-now)/1000 )));
};

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
};

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
};

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
};

// cps a : ( a -> () ) -> ()
// event : (cps a, cps a, Promise a) -> Stream a
Stream.bind = function(sub, unsub, untilP) {
  var events = [], defs = [];
  var res = sub(slot);
  unsub = unsub || res || noop;
  return next();
  
  function next() {
    var nextE = nextEvent(),
        onErr = err => () => { unsub(slot, res); return Stream.Abort(err) },
        nextP = !untilP ?
          nextE.then( v => Stream.Cons(v, next() ), Stream.Abort ) :
          raceL([
            untilP.then( _ => () => { unsub(slot); return Stream.Empty; }, onErr ),
            nextE.then( v => () => Stream.Cons(v, next()), onErr )
          ]);
    return Stream.Future(nextP);
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
  
};