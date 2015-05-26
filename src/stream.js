import adt from "./adt";
import { raceL } from "./utils";

var noop = () => {}, 
    undef = noop,
    eq = (a,b) => a === b,
    never = new Promise(noop);


// ADT definition
export function Stream() {}
adt( Stream, {
  Empty  : new Stream(),
  Abort  : error => ({error}),
  Future : promise => ({promise}),
  Cons   : (head, tail) => ({head, tail})
});

// anError : Object
// aBool : Object (javascript truth)

// map : ( Stream a, a -> b | Promise b ) -> Stream b
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
    );
};

// const : (Stream a, b) -> Stream b
Stream.prototype.const = function (val) {
  return this.map( _ => val );
};


// mapError : (Stream a, anError -> Stream a) -> Stream a
Stream.prototype.mapError = function(f) { 
  
    return  this.isEmpty ? this :
            this.isAbort ? f(this.error) :
          
  this.isCons ?
    Stream.Cons( this.head, this.tail.mapError(f)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.mapError(f), Stream.Abort )  
    );
};

// filter : (Stream a, a -> aBool | Promise aBool) -> Stream a
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
    );
};


// length : Stream a => Promise Number
Stream.prototype.length = function() { 
    return  this.reduce( (n, _) =>  n + 1, 0 );
};

// first : Stream a -> Stream a
Stream.prototype.first = function() { 
    return  this.isEmpty ? Promise.reject('Empty Stream') :
    
    this.isAbort     ? Promise.reject(this.error) :
          
    this.isCons ? Promise.resolve(this.head) :
  
    /* isFuture */ this.promise.then( s => s.first(), Promise.reject );
};

// last : Stream a -> Stream a
Stream.prototype.last = function() { 
  return this.reduce( (_, cur) => cur );
};

// at : ( Stream a, Number ) -> Stream a
Stream.prototype.at = function(idx) { 
  
  return  this.isEmpty ? Promise.reject('index too large') :
  
  idx < 0 ? Promise.reject('negative index') :
  
  this.isAbort ? Promise.reject(this.err) :
  
  this.isCons ? 
    ( idx === 0 ? Promise.resolve(this.head) : this.tail.at(idx-1) ) :
  
  // isFuture
    this.promise.then( s => s.at(idx), Stream.Abort );
};


// take : (Stream a, Number ) -> Stream a
Stream.prototype.take = function(n) { 
  
  return  this.isEmpty || n < 1 ? Stream.Empty :
          
  this.isAbort ? this :
  
  this.isCons  ? Stream.Cons( this.head, this.tail.take(n-1)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.take(n), Stream.Abort )  
    );
};

// takeWhile : (Stream a, a -> aBool | Promise aBool) -> Stream a
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
    );
};

// takeUntil  : (Stream a, Promise) -> Stream a
Stream.prototype.takeUntil = function(promise) { 
  
  return this.isEmpty || this.isAbort ?  this :
  
  this.isCons ? Stream.Cons( this.head, this.tail.takeUntil(promise) ) :
        
  // isFuture
  Stream.Future(
    raceL([
      promise.then( _ => () => Stream.Empty, Stream.Abort ),
      this.promise.then( s => () => s.takeUntil(promise), Stream.Abort )  
    ])
  );
};

// skip : (Stream a, n) -> Stream a
Stream.prototype.skip = function(n) { 
  
  return  this.isEmpty || this.isAbort || n < 1 ? this :
          
  this.isCons ? this.tail.skip(n-1) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.skip(n), Stream.Abort )  
    );
};

// skipWhile : (Stream a, a -> aBool | Promise aBool) -> Stream a
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
    );
};

// skipUntil  : (Stream a, Promise) -> Stream a
Stream.prototype.skipUntil = function(promise) {
  
  return this.isEmpty || this.isAbort ?  this :
  
  this.isCons ? this.tail.skipUntil(promise) :
        
  // isFuture
  Stream.Future(
    raceL([
      this.promise.then( s => () => s.skipUntil(promise), Stream.Abort ),
      promise.then( _ => () => this, Stream.Abort )  
    ])
  );
};

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
    splitP( this.promise.then( s => s.span(p), Stream.Abort ) );
  
  function splitP(p) {
    return [
      Stream.Future( p.then( sp => sp[0] ) ),
      Stream.Future( p.then( sp => sp[1] ) )
    ];
  }
};

// break : (Stream a, a -> aBool | Promise aBool) -> [Stream a, Stream a]
Stream.prototype.break = function(p) { 
  var s1, s2;
  return ( this.isEmpty || this.isAbort) ? [this, this] :
          
  this.isCons ? splitP(
      Promise.resolve( p(this.head) )
      .then( ok => 
          !ok ? 
            ( [s1, s2] = this.tail.break(p), [Stream.Cons(this.head, s1), s2] ) : 
            [Stream.Empty, this], 
          Stream.Abort )) :
   
  // isFuture
    splitP( this.promise.then( s => s.break(p), Stream.Abort ) );
  
  function splitP(p) {
    return [
      Stream.Future( p.then( sp => sp[0] ) ),
      Stream.Future( p.then( sp => sp[1] ) )
    ];
  }
};

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
};

// group : Stream a => Stream (Stream a)
Stream.prototype.group = function() {
  return this.groupBy( (x1, x2) => x1 === x2  );
};

// splitBy : (Stream a, a -> Stream a) -> Stream a
Stream.prototype.splitBy = function(f) {
  
  return ( this.isEmpty || this.isAbort) ? this :
          
  this.isCons ? f(this.head).concat( this.tail.splitBy(f) ) :
  
  // isFuture
  Stream.Future( this.promise.then( s => s.splitBy(f), Stream.Abort ) );
};


// chunkBy : (Stream a, a -> [Stream a, a | Promise a]) -> Stream a
Stream.prototype.chunkBy = function(zero, f) { 
  var chunks, residual;
  
  return go(zero, this);
  
  function go(acc, me) {

    return me.isEmpty || me.isAbort ?
      // if we are left with a non-zero residual result yield it
      zero === acc ? this : Stream.Cons(acc, me) :
    
    me.isCons ?
      ( [chunks, residual] = f(acc, me.head),
        chunks.concat(
          Stream.Future(
            Promise.resolve(residual).then( newAcc => go(newAcc, me.tail), Stream.Abort  )  
          )
        )
      ) :
    
    // isFuture
      Stream.Future( me.promise.then( s => go(acc, s), Stream.Abort ) );
  }
};

// reduce : ( Stream a, (b, a) -> b | Promise b, b | Promise b ) => Promise b
Stream.prototype.reduce = function(f, seed = undef) {
  
  return  this.isEmpty ?
    ( seed !== undef ? Promise.resolve(seed) : 
      Promise.reject('Empty Stream')
    ) :
  
  this.isAbort ? Promise.reject(this.error) :
  
  this.isCons ?
    ( seed === undef ? 
        this.tail.reduce(f, this.head) :
        Promise.resolve(seed)
          .then(acc => this.tail.reduce( f, f(acc, this.head) ), Promise.reject)
    ) :
   
  
  // isFuture
    this.promise.then( s => s.reduce(f, seed), Promise.reject );
};

// scan : ( Stream a, (b, a) -> b | Promise b, b | Promise b ) -> Stream a
Stream.prototype.scan = function(f, seed = undef) { 
  let acc1;
  
  return  ( this.isEmpty || this.isAbort ) ? this :

  
  this.isCons ?
    ( seed === undef ? 
        Stream.Cons(this.head, this.tail.scan(f, this.head) ) :
        Stream.Future(  
          Promise.resolve(seed)
            .then(acc => (
                acc1 = f(acc, this.head),
                Stream.Cons(acc1, this.tail.scan( f, acc1 ))
              ), Stream.Abort)
          )
    ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.scan(f, seed), Stream.Abort )  
    );
};

// window : ( Stream a, Number, Number ) -> Stream [a]
Stream.prototype.window = function(size, min = 0) { 
  return this.scan( (p,c) => p.length < size ? p.concat(c) : p.slice(1).concat(c), [] )
            .filter( arr => arr.length >= min );
};

// changes : ( Stream a, (a,a) -> aBool ) -> Stream a
Stream.prototype.changes = function(f = eq, last = undef) { 
  return this.isEmpty || this.isAbort ? this :
  
  this.isCons ? 
    ( !f(this.head, last) ?
        Stream.Cons(this.head, this.tail.changes(f, this.head) ) :
        this.tail.changes(f, this.head)
    ) :
    
  // isFuture
    Stream.Future(
      this.promise.then( s => s.changes(f, last), Stream.Abort )  
    );
};


// toArray : Stream a -> Promise [a]
Stream.prototype.toArray = function() {
  return this.reduce( (xs, x) => xs.concat(x), [] );
};

// all : ( Stream a, a -> aBool | Promise aBool ) => Promise Boolean
Stream.prototype.all = function(pred)  {
  return this.reduce( 
    (prev, cur) => 
      Promise.resolve(pred(cur)).then( ok =>  prev && !!ok, Promise.reject ), 
    true
  );
};

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
};

// join : ( Stream a, a) -> Stream a
Stream.prototype.join = function(sep = ', ')  {
  return this.reduce( (prev, cur) => prev + sep + cur );
};

// concat : (Stream a, Stream a) -> Stream a
Stream.prototype.concat = function(s2) { 
  
  return  this.isEmpty ? s2 :
          
  this.isAbort ? this :
  
  this.isCons ? Stream.Cons( this.head, this.tail.concat(s2)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.concat(s2), Stream.Abort )  
    );
};

// combine : (Stream a, Stream b, (a,b) -> c ) -> Stream c
Stream.prototype.combine = function(s2, f, latest1=undef, latest2=undef) {
  
  return  this.isEmpty && s2.isEmpty ? Stream.Empty :
  
  this.isAbort ? this :
  s2.isAbort ? s2 :
  
  this.isCons ?
    ( latest2 !== undef ?
        Stream.Cons( f(this.head, latest2), this.tail.combine(s2, f, this.head, latest2) ) :
        this.tail.combine(s2, f, this.head, latest2)
    ) :
    
  s2.isCons ?
    ( latest1 !== undef ?
        Stream.Cons( f(latest1, s2.head), this.combine(s2.tail, f, latest1, s2.head) ) :
        this.combine(s2.tail, f, latest1, s2.head)
    ) :
  
  this.isFuture  && s2.isEmpty ?
  ( latest2 !== undef ?
      Stream.Future(
        this.promise.then( s => s.combine(s2, f, latest1, latest2), Stream.Abort )  
      ) :
      Stream.Empty
  ) :
    
    
  s2.isFuture && this.isEmpty ?
  ( latest1 !== undef ?
      Stream.Future(
        s2.promise.then( s => this.combine(s, f, latest1, latest2), Stream.Abort )  
      ) :
      Stream.Empty
  ) :
  
  /* this.isFuture && s2.isFuture */
    Stream.Future(
      raceL([
        this.promise.then( s => () => s.combine(s2, f, latest1, latest2), Stream.Abort ),
        s2.promise.then( s => () => this.combine(s, f, latest1, latest2), Stream.Abort )  
      ])
    )
  
};

Stream.combine = function(ss, f) {
  return ss.reduce((s1, s2) => s1.combine(s2, (x,y) => [].concat(x,y) ))
          .map( args => f ? f(...args) : args );
}

// merge : (Stream a, Stream a) -> Stream a
Stream.prototype.merge = function(s2) { 
  
  return this.isEmpty ? s2 :
  
  this.isAbort ? this :
    
  this.isCons ? Stream.Cons( this.head, this.tail.merge(s2) ) :
  
  // this.isFuture
  (!s2.isFuture ? 
    s2.merge(this) :
    Stream.Future(
      raceL([
        this.promise.then(s => () => s.merge(s2), Stream.Abort),
        s2.promise.then(s => () => s.merge(this), Stream.Abort)
      ])
    )
  );
};

// relay : (Stream a, Stream a) -> Stream a
Stream.prototype.relay = function(s2) {
  return this.takeUntil( s2.first().catch( _ => never) ).concat(s2);
};

// zip : (Stream a, Stream b) -> Stream [a,b]
Stream.prototype.zip = function(s2) { 
  
  return  this.isEmpty || this.isAbort ? this :
  
  s2.isEmpty || s2.isAbort ? s2 :
  
  this.isCons && s2.isCons ?
    Stream.Cons([this.head, s2.head], this.tail.zip(s2.tail)) :
    
  this.isCons && s2.isFuture ?
    Stream.Future(
      s2.promise.then( s => this.zip(s), Stream.Abort  )
    ) :
    
  // this.isFuture && (s2.isCons || s2.isFuture)
  Stream.Future(
    this.promise.then( s => s.zip(s2), Stream.Abort )  
  );
};


// flatten : ( Stream (Stream a), (Stream a, Stream a) -> Stream a) -> Stream a
Stream.prototype.flatten = function(f) { 
  
  return ( this.isEmpty || this.isAbort) ? this :
          
  this.isCons ? f( this.head, this.tail.flatten(f) ) :
  
  // isFuture
    Stream.Future( this.promise.then( s => s.flatten(f), Stream.Abort ) );
};

// mergeAll : Stream (Stream a) -> Stream a
Stream.prototype.mergeAll = function() { 
  return this.flatten( (s1, s2) => s1.merge(s2)  );
};

// concatAll : Stream (Stream a) -> Stream a
Stream.prototype.concatAll = function() { 
  return this.flatten( (s1, s2) => s1.concat(s2)  );
};

// relayAll : Stream (Stream a) -> Stream a
Stream.prototype.relayAll = function() { 
  return this.flatten( (s1, s2) => s1.relay(s2)  );
};

// zipAll : Stream (Stream a) -> Stream a
Stream.prototype.zipAll = function() { 
  return this.flatten( (s1, s2) => s1.zip(s2)  );
};

// mergeMap : (Stream a, a -> Stream b) -> Stream a
Stream.prototype.mergeMap = function(f) {
  return this.map(f).mergeAll();
};

// concatMap : (Stream a, a -> Stream b) -> Stream a
Stream.prototype.concatMap = function(f) {
  return this.map(f).concatAll();
};

// relayMap : (Stream a, a -> Stream b) -> Stream a
Stream.prototype.relayMap = function(f) {
  return this.map(f).relayAll();
};

// zipMap : (Stream a, a -> Stream b) -> Stream a
Stream.prototype.zipMap = function(f) {
  return this.map(f).zipAll();
};

// debounce : (Stream a, () => Promise) -> Stream a
Stream.prototype.debounce = function(event, last=undef) {
  
  return this.isEmpty || this.isAbort ? 
    ( last !== undef ? Stream.Cons(last, this) : this ) :
  
  this.isCons ? this.tail.debounce(event, this.head) :
  
  // this.isFuture
  ( last === undef ? 
      Stream.Future(this.promise.then( s => s.debounce(event), Stream.Abort )) :
      Stream.Future(raceL([
        event().then( _ => () => Stream.Cons(last, this.debounce(event, undef)), Stream.Abort ),
        this.promise.then( s => () => s.debounce(event, last), Stream.Abort  )
      ]))
  );
  
};

// throttle : (Stream a, () => Promise) -> Stream a
Stream.prototype.throttle = function(event) {
  
  return this.isEmpty || this.isAbort ? this :
  
  this.isCons ? 
    Stream.Cons( this.head, this.tail.skipUntil(event()).throttle(event) ) :
  
  // this.isFuture
  Stream.Future( this.promise.then( s => s.throttle(event), Stream.Abort ) );
  
};

// forEach : (Stream a, a -> (), a -> (), a -> ()) -> ()
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
};

// log : (Stream a, String) -> ()
Stream.prototype.log = function(prefix) {
  this.forEach(
    v => console.log(prefix, ' data :', v),
    err => console.log(prefix, ' error :', err),
    () => console.log(prefix, ' end.')
  );
};


export default Stream;