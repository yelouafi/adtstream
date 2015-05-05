import adt from "./adt"
import { raceLP } from "./utils"

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

// map : (Stream a, a -> b) => Stream b
Stream.prototype.map = function(f) { 
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    Stream.Cons( f(this.head), this.tail.map(f)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.map(f), Stream.Abort )  
    )
}

// anError : Object
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

// async map
// asyncMap : ( Stream a, a -> Promise a ) => Stream a
Stream.prototype.asyncMap = function(f) { 
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    Stream.Future(
      f(this.head).then( h => Stream.Cons(h, this.tail.asyncMap(f)), Stream.Abort ) 
    ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.asyncMap(f), Stream.Abort )  
    )
}

// async map
// asyncMapError : ( Stream a, anError -> Promise (Stream a) ) => Stream a
Stream.prototype.asyncMapError = function(f) { 
  return this.asyncMap( err => Stream.Future(f(err)) );
}

// length : Stream a => Promise Number
Stream.prototype.length = function() { 
    return  this.isEmpty || this.isAbort ? Promise.resolve(0) :
          
    this.isCons ? this.tail.length().then( len => len + 1 ) :
  
    /* isFuture */ this.promise.then( s => s.length(), Promise.resolve(0) );
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
  
    return go(undef, this);
    
    function go(prec, me) {
        return  me.isEmpty ? 
          ( prec !== undef ? Promise.resolve(prec) : Promise.reject('Stream.last: Empty Stream!') ):
    
        me.isAbort     ? Promise.reject(me.error) :
              
        me.isCons ? go(me.head, me.tail) :
  
        /* isFuture */ me.promise.then( s => go(prec, s), Promise.reject );
    }
}

// at : Stream a => Promise a
Stream.prototype.at = function(idx) { 
  return  this.isEmpty || idx < 0 ? 
    Promise.reject('Stream.at : End of Stream!') :
          
  this.isAbort ? 
    Promise.reject(this.err) :
  
  this.isCons ? 
    (idx === 0 ?
      Promise.resolve(this.head) :
      this.tail.at(idx-1)
    ) :
  
  // isFuture
    this.promise.then( s => s.at(idx), Stream.Abort )
}


// take : (Stream a, n) => Stream a
Stream.prototype.take = function(n) { 
  return  this.isEmpty || n < 1 ? Stream.Empty :
          
  this.isAbort ? this :
  
  this.isCons ?
    Stream.Cons( this.head, this.tail.take(n-1)  ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.take(n), Stream.Abort )  
    )
}

// aBoolean : Object (javascript truth)
// takeWile : (Stream a, a -> aBoolean) => Stream a
Stream.prototype.takeWhile = function(p) { 
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    (p(this.head) ? 
      Stream.Cons( this.head, this.tail.takeWhile(p)  ) :
      Stream.Empty
    ) :
  
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

// aBoolean : Object (javascript truth)
// skipWhile : (Stream a, a -> aBoolean) => Stream a
Stream.prototype.skipWhile = function(p) { 
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    (p(this.head) ? 
      this.tail.skipWhile(p) :
      this
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

// aBoolean : Object (javascript truth)
// filter : (Stream a, a -> aBoolean) => Stream a
Stream.prototype.filter = function(p) { 
  return  this.isEmpty || this.isAbort ? this :
          
  this.isCons ?
    (p(this.head) ? 
      Stream.Cons( this.head, this.tail.filter(p)  ) :
      this.tail.filter(p)
    ) :
  
  // isFuture
    Stream.Future(
      this.promise.then( s => s.filter(p), Stream.Abort )  
    )
}

// span : (Stream a, a -> aBoolean) -> [Stream a, Stream a]
Stream.prototype.span = function(p) { 
  if( this.isEmpty || this.isAbort)
    return [this, this];
          
  if(this.isCons) {
    if( p(this.head) ) {
      var res = this.tail.span(p);
      return [ Stream.Cons(this.head, res[0]), res[1] ];
    } else
      return [Stream.Empty, this];
  }
  
  // isFuture
  var futSpan = this.promise.then( s => s.span(p), Stream.Abort );
  return [
      Stream.Future( futSpan.then( sp => sp[0] ) ),
      Stream.Future( futSpan.then( sp => sp[1] ) )
  ];
}

// groupBy : (Stream a, (a, a) -> aBoolean) => Stream (Stream a)
Stream.prototype.groupBy = function(p) { 
  if( this.isEmpty || this.isAbort)
    return this;
          
  if(this.isCons) {
    var span = this.tail.span( x => p(this.head, x)  );
    return Stream.Cons(
      Stream.Cons(this.head, span[0]),
      span[1].groupBy(p)
    )
  }
  
  // isFuture
  return Stream.Future( this.promise.then( s => s.groupBy(p), Stream.Abort ) );
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
  
  return go(zero, this)
  
  function go(acc, me) {
    //console.log('acc', acc, ' isEmpty ? ', !!me.isEmpty)
    if(me.isEmpty || me.isAbort) 
      return zero === acc ? this : Stream.Cons(acc, me);
    
    if(me.isCons) {
      var res = f(acc, me.head);
      return res[0].concat(
        Stream.Future(
          res[1].then( newSeed => go(newSeed, me.tail), Stream.Abort  )  
        )
      )
    }
    
    // isFuture
    return Stream.Future( me.promise.then( s => go(acc, s), Stream.Abort ) );
  }
}

// reduce : ( b, Stream a, (b, a) -> a ) => Promise b
Stream.prototype.reduce = function(seed, f) { 
  return  this.isEmpty ? Promise.resolve(seed) :
  
  this.isAbort ? Promise.reject(this.error) :
  
  this.isCons ?
    this.tail.reduce( f(seed, this.head), f ) :
  
  // isFuture
    this.promise.then( s => s.reduce(seed, f), Promise.reject )  
}

// toArray : Stream a -> Promise [a]
Stream.prototype.toArray = function() {
  return this.reduce( [],  (xs, x) => xs.concat(x) );
}

// all : ( Stream a, a -> aBoolean ) => Promise Boolean
Stream.prototype.all = function(pred)  {
  return this.reduce( true, (prev, cur) => prev && !!pred(cur) );
}

// any : ( Stream a, a -> aBoolean ) => Promise Boolean
Stream.prototype.any = function(pred)  {
  return this.reduce( false, (prev, cur) => prev || !!pred(cur) );
}

// concat : (Stream a, Stream a) => Stream a
Stream.prototype.concat = function(s2) { 
  return  this.isEmpty ? s2 :
          
  this.isAbort ? this :
  
  this.isCons ?
    Stream.Cons( this.head, this.tail.concat(s2)  ) :
  
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
    s2.merge(s1) :
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
  
  this.isCons ?
    ( s2.isCons ?
        Stream.Cons([this.head, s2.head], this.tail.zip(s2.tail)) :
      s2.isFuture ?
        s2.promise.then( s => this.zip(s), Stream.Abort  ) :
      // s2.isEmpty || s2.isAbort
        s2
    ) :
    
  // isFuture
  Stream.Future(
    this.promise.then( s => s.zip(s2), Stream.Abort )  
  )
}

// zipWith : (Stream a, Stream b, (a, b) -> c) => Stream c
Stream.prototype.zipWith = function(s2, f) {
  return this.zip(s2).map( pair => f.apply(null, pair)  )
}


Stream.prototype.forEach = function(onNext, onError=noop, onComplete=noop) { 
  if(this.isEmpty) onComplete();
    
  if(this.isAbort) onError(this.error);
    
  if(this.isCons) {
    onNext(this.head);
    this.tail.forEach(onNext, onError, onComplete);
  } 
  
  if(this.isFuture)
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