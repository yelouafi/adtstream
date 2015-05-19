import adt from "./adt"
import { raceLP, delayed } from "./utils"

var noop = () => {}, 
    undef = noop,
    constt = v => () => v;


// ADT definition
export function Stream() {}
adt( Stream, {
  Empty  : new Stream(),
  Abort  : error => ({error}),
  Future : promise => ({promise}),
  Cons   : (head, tail) => ({head, tail})
})

// anError : Object
// aBool : Object (javascript truth)

// map : ( Stream a, a -> b | Promise b ) => Stream b
Stream.prototype.map = function(f) { 
  let tailM, futP;
  
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    ( tailM = this.tail.map(f),
      futP = Promise.resolve(f(this.head))
              .then( head => Stream.Cons(head, tailM), Stream.Abort ), 
      Stream.Future(futP) 
    ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.map(f), Stream.Abort )  
    )
}


// mapError : (Stream a, anError -> Stream a) => Stream a
Stream.prototype.mapError = function(f) { 
  
    return  this.isEmpty ? this :
            this.isAbort ? f(this.error) :
          
  this.isCons ?
    Stream.Cons( this.head, this.tail.mapError(f)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.mapError(f), Stream.Abort )  
    )
}

// filter : (Stream a, a -> aBool | Promise aBool) => Stream a
Stream.prototype.filter = function(p) {
  let tailF, futP;
  
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ? 
  ( tailF = this.tail.filter(p),
    futP = Promise.resolve(p(this.head))
            .then( ok => ok ? Stream.Cons(this.head, tailF) : tailF, Stream.Abort),
    Stream.Future( futP )
  ) :

  // isFuture
    Stream.Future(
      this.promise.then( s => s.filter(p), Stream.Abort )  
    )
}


// length : Stream a => Promise Number
Stream.prototype.length = function() { 
    return  this.reduce( (n, _) =>  n + 1, 0 )
}

// first : Stream a => Promise a
Stream.prototype.first = function() { 
    return  this.isEmpty ? Promise.reject('Stream.first: Empty Stream!') :
    
    this.isAbort     ? Promise.reject(this.error) :
          
    this.isCons ? Promise.resolve(this.head) :
  
    /* isFuture */ this.promise.then( s => s.first(), Promise.reject );
}

// last : Stream a => Promise a
Stream.prototype.last = function() { 
  return this.reduce( (_, cur) => cur )
}

// at : ( Stream a, Number ) => Promise a
Stream.prototype.at = function(idx) { 
  
  return  this.isEmpty ? Promise.reject('Stream.at : index too large!') :
  
  idx < 0 ? Promise.reject('Stream.at : negative index!') :
  
  this.isAbort ? Promise.reject(this.err) :
  
  this.isCons ? 
    ( idx === 0 ? Promise.resolve(this.head) : this.tail.at(idx-1) ) :
  
  // isFuture
    this.promise.then( s => s.at(idx), Stream.Abort )
}


// take : (Stream a, Number ) => Stream a
Stream.prototype.take = function(n) { 
  
  return  this.isEmpty || n < 1 ? Stream.Empty :
          
  this.isAbort ? this :
  
  this.isCons  ? Stream.Cons( this.head, this.tail.take(n-1)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.take(n), Stream.Abort )  
    )
}

// takeWile : (Stream a, a -> aBool | Promise aBool) => Stream a
Stream.prototype.takeWhile = function(p) { 
  
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    Stream.Future(
      Promise.resolve( p(this.head) )
        .then( 
          ok => ok ? Stream.Cons(this.head, this.tail.takeWhile(p)) : Stream.Empty, 
          Stream.Abort )) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.takeWhile(p), Stream.Abort )  
    )
}

// takeUntil  : (Stream a, Promise) => Stream a
Stream.prototype.takeUntil = function(promise) { 
  
  return this.isEmpty || this.isAbort ?  this :
  
  this.isCons ? Stream.Cons( this.head, this.tail.takeUntil(promise) ) :
        
  // isFuture
  Stream.Future(
    raceLP([
      promise.then( _ => () => Stream.Empty, Stream.Abort ),
      this.promise.then( s => () => s.takeUntil(promise), Stream.Abort )  
    ])
  )
}

// skip : (Stream a, n) => Stream a
Stream.prototype.skip = function(n) { 
  
  return  this.isEmpty || this.isAbort || n < 1 ? this :
          
  this.isCons ? this.tail.skip(n-1) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.skip(n), Stream.Abort )  
    )
}

// skipWhile : (Stream a, a -> aBool | Promise aBool) => Stream a
Stream.prototype.skipWhile = function(p) { 
  
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    Stream.Future(
      Promise.resolve( p(this.head)  )
        .then( ok => ok ? this.tail.skipWhile(p) : this, Stream.Abort )
    ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.skipWhile(p), Stream.Abort )  
    )
}

// skipUntil  : (Stream a, Promise) => Stream a
Stream.prototype.skipUntil = function(promise) {
  
  return this.isEmpty || this.isAbort ?  this :
  
  this.isCons ? this.tail.skipUntil(promise) :
        
  // isFuture
  Stream.Future(
    raceLP([
      this.promise.then( s => () => s.skipUntil(promise), Stream.Abort ),
      promise.then( _ => () => this, Stream.Abort )  
    ])
  )
}

// span : (Stream a, a -> aBool | Promise aBool) -> [Stream a, Stream a]
Stream.prototype.span = function(p) { 
  var s1, s2;
  return ( this.isEmpty || this.isAbort) ? [this, this] :
          
  this.isCons ? splitP(
      Promise.resolve( p(this.head) )
      .then( ok => 
          ok ? 
            ( [s1, s2] = this.tail.span(p), [Stream.Cons(this.head, s1), s2] ) : 
            [Stream.Empty, this], 
          Stream.Abort )) :
   
  // isFuture
    splitP( this.promise.then( s => s.span(p), Stream.Abort ) )
  
  function splitP(p) {
    return [
      Stream.Future( p.then( sp => sp[0] ) ),
      Stream.Future( p.then( sp => sp[1] ) )
    ];
  }
}

// groupBy : (Stream a, (a, a) -> aBool | Promise aBool) => Stream (Stream a)
Stream.prototype.groupBy = function(p) {
  var s1, s2;
  
  return this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    ( [s1, s2] = this.tail.span( x => p(this.head, x)), 
      Stream.Cons(
        Stream.Cons(this.head, s1),
        s2.groupBy(p)
      )
    ) :
  
  // isFuture
    Stream.Future( this.promise.then( s => s.groupBy(p), Stream.Abort ) );
}

// group : Stream a => Stream (Stream a)
Stream.prototype.group = function() {
  return this.groupBy( (x1, x2) => x1 === x2  );
}

// splitBy : (Stream a, a -> Stream a) => Stream a
Stream.prototype.splitBy = function(f) {
  
  return ( this.isEmpty || this.isAbort) ? this :
          
  this.isCons ? f(this.head).concat( this.tail.splitBy(f) ) :
  
  // isFuture
  Stream.Future( this.promise.then( s => s.splitBy(f), Stream.Abort ) );
}


// chunkBy : (Stream a, a -> [Stream a, Promise a]) => Stream a
Stream.prototype.chunkBy = function(zero, f) { 
  var chunks, residual;
  
  return go(zero, this)
  
  function go(acc, me) {

    return me.isEmpty || me.isAbort ?
      // if we are left with a non-zero residual result yield it
      zero === acc ? this : Stream.Cons(acc, me) :
    
    me.isCons ?
      ( [chunks, residual] = f(acc, me.head),
        chunks.concat(
          Stream.Future(
            residual.then( newAcc => go(newAcc, me.tail), Stream.Abort  )  
          )
        )
      ) :
    
    // isFuture
      Stream.Future( me.promise.then( s => go(acc, s), Stream.Abort ) );
  }
}

// reduce : ( Stream a, (b, a) -> b | Promise b, b | Promise b ) => Promise b
Stream.prototype.reduce = function(f, seed = undef) {
  
  return  this.isEmpty ?
    ( seed !== undef ? Promise.resolve(seed) : 
      Promise.reject('Stream.reduce : Empty Stream!')
    ) :
  
  this.isAbort ? Promise.reject(this.error) :
  
  this.isCons ?
    ( seed === undef ? 
        this.tail.reduce(f, this.head) :
        Promise.resolve(seed)
          .then(acc => this.tail.reduce( f, f(seed, this.head) ), Promise.reject)
    ) :
   
  
  // isFuture
    this.promise.then( s => s.reduce(f, seed), Promise.reject )  
}

// toArray : Stream a -> Promise [a]
Stream.prototype.toArray = function() {
  return this.reduce( (xs, x) => xs.concat(x), [] );
}

// all : ( Stream a, a -> aBool | Promise aBool ) => Promise Boolean
Stream.prototype.all = function(pred)  {
  return this.reduce( 
    (prev, cur) => 
      Promise.resolve(pred(cur)).then( ok =>  prev && !!ok, Promise.reject ), 
    true
  );
}

// any : ( Stream a, a -> aBool | Promise aBool ) => Promise Boolean
Stream.prototype.any = function(pred)  {
  return this.isEmpty ? Promise.resolve(false) :
  
  this.isAbort ? Promise.reject(this.err) :
  
  this.isCons ?
    Promise.resolve(
      pred(this.head).then(ok => ok || this.tail.any(pred)), 
      Stream.Abort ) :
  
  /* isFuture */
    this.promise.then( s => s.any(pred) );
}

// join : ( Stream a, a) => Promise a
Stream.prototype.join = function(sep = ', ')  {
  return this.reduce( (prev, cur) => prev + sep + cur );
}

// concat : (Stream a, Stream a) => Stream a
Stream.prototype.concat = function(s2) { 
  
  return  this.isEmpty ? s2 :
          
  this.isAbort ? this :
  
  this.isCons ? Stream.Cons( this.head, this.tail.concat(s2)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.concat(s2), Stream.Abort )  
    )
}

// merge : (Stream a, Stream a) => Stream a
Stream.prototype.merge = function(s2) { 
  
  return this.isEmpty ? s2 :
  
  this.isAbort ? this :
    
  this.isCons ? Stream.Cons( this.head, this.tail.merge(s2) ) :
  
  // this.isFuture
  (!s2.isFuture ? 
    s2.merge(this) :
    Stream.Future(
      raceLP([
        this.promise.then(s => () => s.merge(s2), Stream.Abort),
        s2.promise.then(s => () => s.merge(this), Stream.Abort)
      ])
    )
  )
}

// flatten : Stream (Stream a) => Stream a
Stream.prototype.flatten = function() { 
  
  return ( this.isEmpty || this.isAbort) ? this :
          
  this.isCons ? this.head.merge( this.tail.flatten() ) :
  
  // isFuture
    Stream.Future( this.promise.then( s => s.flatten(), Stream.Abort ) );
}

// flatMap : (Stream a, a -> Stream b) => Stream b
Stream.prototype.flatMap = function(f) {
  return this.map(f).flatten();
}

// zip : (Stream a, Stream b) => Stream [a,b]
Stream.prototype.zip = function(s2) { 
  
  return  this.isEmpty || this.isAbort ? this :
  
  s2.isEmpty || s2.isAbort ? s2 :
  
  this.isCons && s2.isCons ?
    Stream.Cons([this.head, s2.head], this.tail.zip(s2.tail)) :
    
  this.isCons && s2.isFuture ?
    s2.promise.then( s => this.zip(s), Stream.Abort  ) :
    
  // this.isFuture
  Stream.Future(
    this.promise.then( s => s.zip(s2), Stream.Abort )  
  )
}

// zipWith : (Stream a, Stream b, (a, b) -> c | Promise c) => Stream c
Stream.prototype.zipWith = function(s2, f) {
  return this.zip(s2).map( pair => f.apply(null, pair)  )
}

// event : () => Promise
// debounce : (Stream a, event) => Stream a
Stream.prototype.debounce1 = function(event, immediate = false) {
  let events = [];
  
  return !immediate ?
    this.filter(
      x => {
        events.push(x);
        return event().then( _ => events.shift() && !events.length );
      }
    ) :
    this.filter(
      x => {
        var len = events.length;
        events.push(x);
        event().then( _ => events.splice(len, 1) );
        return !len;
      }
    )
}

// event : () => Promise
// debounce : (Stream a, event) => Stream a
Stream.prototype.debounce = function(event, last=undef) {
  let p;
  return this.isEmpty || this.isAbort ? 
    ( last !== undef ? Stream.Cons(last, this) : this ) :
  
  this.isCons ? this.tail.debounce(event, this.head) :
  
  // this.isFuture
  ( last === undef ? 
      Stream.Future(this.promise.then( s => s.debounce(event), Stream.Abort )) :
      Stream.Future(raceLP([
        event().then( _ => () => Stream.Cons(last, this.debounce(event, undef)), Stream.Abort ),
        this.promise.then( s => () => s.debounce(event, last), Stream.Abort  )
      ]))
  )
  
}


Stream.prototype.forEach = function(onNext, onError=noop, onComplete=noop) { 
  
  return this.isEmpty ? onComplete() :
    
  this.isAbort ? onError(this.error) :
    
  this.isCons ? (
    onNext(this.head),
    this.tail.forEach(onNext, onError, onComplete)
  ) :

  /* isFuture */
    this.promise.then( 
      stream => stream.forEach(onNext, onError, onComplete),
      onError
    );
}

Stream.prototype.log = function(prefix) {
  this.forEach(
    v => console.log(prefix, ' data :', v),
    err => console.log(prefix, ' error :', err),
    () => console.log(prefix, ' end.')
  );
}


export default Stream;