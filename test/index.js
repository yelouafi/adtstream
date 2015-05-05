/* global describe it */

import { Stream, utils } from "../src"

var assert = require("assert")

function abortedSeq(arr, delay, interval) {
  return from(0, delay);
  
  function from(index, millis) {
    
    var getter = () =>
        index < arr.length ? 
          Stream.Cons( arr[index], from(index+1, interval) ) : 
          Stream.Abort('aborted seq!');
        
    return Stream.Future( utils.getLater(getter, millis) );
  }
}

function assertP(promise, assertion, msg) {
  return promise.then( val => assertion(val, msg) )
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

assertP.rejected = function(promise, exp) {
  return promise.then( val => assert(false, 'promise resolved with '+val+', should be rejected'), err => assert(true) );
}

var minSpan = occs => Math.min( ...occs.map( o => o.span) )
var maxSpan = occs => Math.max( ...occs.map( o => o.span) )

// captureS : Stream -> Promise [(time, value)]
function captureSeq(s) {
  var seq = { occs: [] }, lastTime = Date.now();
  return new Promise((res, rej) => {
    s.forEach(
      v => {
        var now = Date.now(), 
            span = now - lastTime;
            
        if(!seq.occs.length)
          seq.delay = span;
        
        seq.occs.push({ time: now, span: seq.occs.length ? span : now , value: v });
        lastTime = now;
      }, rej, 
      () => {
        seq.minSpan = minSpan(seq.occs);
        res(seq);
      })
  });
}



var assertS = function() {}
assertS.minSpan = function (s, min) {
  return captureSeq(s).then( occs => {
    var minsp = minSpan(occs);
    assert( minsp >= min, "min span " + minsp + " should be >= ", min )
  })
}

assertS.seq = function (s, arr, delay, minSpan) {
  return captureSeq(s).then( seq => {
    var diffDelay = seq.delay - delay,
        diffSpan = seq.minSpan - minSpan;
    assert.deepEqual(seq.occs.map( o => o.value), arr)
    assert( diffDelay <= 10 && diffDelay >= -5, 'sequence initial delay '+seq.delay+' should be ~= ' + delay + '(diff = '+diffDelay+')')
    assert( diffSpan <= 10 && diffSpan >= -5, 'sequence min. span '+seq.minSpan+' should be ~= ' + minSpan  + '(diff = '+diffSpan+')')
  })
}

describe('Stream', () => {
  
  describe('#seq()', () =>
    it('should yields a sequence ([1..3], 20ms, 50ms)', () =>
      assertS.seq( Stream.seq([1,2,3], 20, 50), [1,2,3], 20, 50 )
    )
  )
  
  describe('#range()', () =>
    it('should yields a sequence ([1..3], 20ms, 50ms)', () =>
      assertS.seq( Stream.range(1,3 , 20, 50), [1,2,3], 20, 50 )
    )
  )
  
  describe('#map()', () =>
    it('should maps a sequence of (1..3, 20ms, 50ms) to a seq of (11..13, 20ms, 50ms)', () => {
      var seq2 = Stream.seq([1,2,3], 20, 50).map( x => x + 10 )
      return assertS.seq( seq2, [11,12,13], 20, 50 )
    })
  )
  
  describe('#mapError()', () =>
    it('should extends an aborted sequence of (1..3, 20ms, 50ms) with a seq of (4..5, 50ms, 50ms)', () => {
      var seq2 = abortedSeq( [1,2,3], 20, 50 ).mapError( (_ => Stream.seq([4,5,6], 1, 50)) )
      return assertS.seq( seq2, [1,2,3,4,5,6], 20, 50 )
    })
  )
  
  describe('#asyncMap()', () =>
    it('should maps a sequence of (1..3, 20ms, 50ms) to a seq of (1..3, 70ms, 100ms)', () => {
      var idx = 1,
          seq2 = Stream.seq([1,2,3], 20, 50)
          .asyncMap( x => utils.getLater(() => x, 50*(idx++)) )
      return assertS.seq( seq2, [1,2,3], 70, 100 )
    })
  )
  
    
  describe('#length()', () =>
    it('should return the length (3) of a sequence ([1,2,3],...)', () =>
      assertP.equal( Stream.seq([1,2,3], 0, 50).length(), 3 )
    )
  )
  
  describe('#first()', () => {
    it('should return the first occurrence (1) from a sequence ([1,2,3],...)', () =>
      assertP.equal( Stream.seq([1,2,3], 20, 50).first(), 1 )
    )
    
    it('should reject the promise of first element if the stream is Empty', () =>
      assertP.rejected( Stream.seq([], 20, 50).first() )
    )
  })
  
  describe('#last()', () => {
    it('should return the last occurrence (3) from a sequence ([1,2,3],...)', () =>
      assertP.equal( Stream.seq([1,2,3], 20, 50).last(), 3 )
    )
    
    it('should reject the promise of last element if the stream is Empty', () =>
      assertP.rejected( Stream.seq([], 20, 50).last() )
    )
  })
  
  describe('#at()', () => {
    it('should return the 2nd occurrence (2) from a sequence ([1,2,3],...)', () =>
      assertP.equal( Stream.seq([1,2,3], 20, 50).at(1), 2 )
    )
    
    it('should reject the promise of 4th occurrence from a sequence ([1,2,3],...)', () =>
      assertP.rejected( Stream.seq([1,2,3], 20, 50).at(3) )
    )
  })
  
  describe('#take()', () => {
    it('should return a sequence ([1,2], 20ms, 50ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () =>
      assertS.seq( Stream.seq([1,2,3,4,5,6], 20, 50).take(2), [1,2], 20, 50 )
    )
  })
  
  describe('#takeWhile()', () => {
    it('should return a sequence ([1,2,3,4], 20ms, 50ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () =>
      assertS.seq( Stream.seq([1,2,3,4,5,6], 20, 50).takeWhile(x => x < 5), [1,2,3,4], 20, 50 )
    )
  })
  
  describe('#takeUntil()', () => {
    it('should return a sequence ([1,2,3], 20ms, 50ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () =>
      assertS.seq( 
        Stream.seq([1,2,3,4,5,6], 20, 50).takeUntil(utils.getLater( () => 1, 190)), 
        [1,2,3,4], 20, 50 
      )
    )
  })
  
  describe('#skip()', () => {
    it('should return a sequence ([5,6], 220ms, 50ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () =>
      assertS.seq( Stream.seq([1,2,3,4,5,6], 20, 50).skip(4), [5,6], 220, 50 )
    )
  })
  
  describe('#skipWhile()', () => {
    it('should return a sequence ([4,5,6], 170ms, 50ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () =>
      assertS.seq( Stream.seq([1,2,3,4,5,6], 20, 50).skipWhile(x => x < 4), [4,5,6], 170, 50 )
    )
  })
  
  describe('#skipUntil()', () => {
    it('should return a sequence ([5,6], 220ms, 50ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () =>
      assertS.seq( 
        Stream.seq([1,2,3,4,5,6], 20, 50).skipUntil(utils.getLater( () => 1, 190)), 
        [5,6], 220, 50 
      )
    )
  })
  
  describe('#filter()', () => {
    it('should return a sequence ([2,4,6], 70ms, 100ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () =>
      assertS.seq( 
        Stream.seq([1,2,3,4,5,6], 20, 50).filter( x => !(x%2) ), 
        [2,4,6], 70, 100 
      )
    )
  })
  
  describe('#span()', () => {
    it('should return 2 sequences ([1,2], 20ms, 50ms) and ([3,4,5,6], 120ms, 50ms) from a sequence ([1,2,3,4,5,6], 20ms, 50ms)', () => {
      var ss = Stream.seq([1,2,3,4,5,6], 20, 50).span( x => x < 3 )
      return Promise.all([
        assertS.seq( ss[0], [1,2], 20, 50),
        assertS.seq( ss[1], [3,4,5,6], 120, 50)
      ])
    })
  })
  
  describe('#group()', () => {
    it('should return 3 sequences ([1,1], 20ms, 50ms), ([3,3], 120ms, 50ms) and ([5,5], 220ms, 50ms) from a sequence ([1,1,3,3,5,5], 20ms, 50ms)', () => {
      var ss = Stream.seq([1,1,3,3,5,5], 20, 50).group()
      return Promise.all([
        assertS.seq( Stream.Future(ss.at(0)), [1,1], 20, 50),
        assertS.seq( Stream.Future(ss.at(1)), [3,3], 120, 50),
        assertS.seq( Stream.Future(ss.at(2)), [5,5], 220, 50)  
      ])
    })
  })
  
  describe('#splitBy()', () => {
    it('should return a sequences (["one", "tow", "three", "four"], 20ms, 50ms) from a sequence (["one;tow;", "three;four"], 20ms, 50ms)', () => {
      var ss = Stream.seq(["one;tow;", "three;four"], 20, 50).splitBy( s => Stream.array( s.split(";").filter( s => s !== "") ) )
      return assertS.seq( ss, ["one", "tow", "three", "four"], 20, 0)
    })
  })
  
  describe('#chunkBy()', () => {
    it('should return a sequences (["one", "tow", "three", "four"], 20ms, 0ms) from a sequence (["on", "e\\ntow\\nthr", "ee\\nfo", "ur"], 20ms, 50ms)', () => {
      var ss = Stream.seq(["on", "e\ntow\nthr", "ee\nfo", "ur"], 20, 50)
                .chunkBy( '', (prec, s) => {
                  var lines = s.split('\n'), head = lines[0], last = lines.length - 1;
                  return (last > 0) ?
                    [ Stream.array([].concat(prec + head, lines.slice(1, last))), Promise.resolve(lines[last]) ] :
                    [ Stream.Empty, Promise.resolve(prec + head) ];
                })
      return assertS.seq( ss, ["one", "tow", "three", "four"], 70, 0)
    })
  })
  
    
  describe('#toArray()', () =>
    it('should yield [1,2,3] from a sequence ([1,2,3],...)', () =>
      assertP.deepEqual( Stream.seq([1,2,3], 0, 50).toArray(), [1,2,3] )
    )
  )
  
  describe('#all()', () =>
    it('should yield (true) from a sequence ([1,3,7,21],...)', () =>
      assertP.equal( Stream.seq([1,3,7,21], 0, 50).all( x => !!(x % 2) ), true )
    )
  )
  
  describe('#any()', () =>
    it('should yield (false) from a sequence ([1,3,7,21],...)', () =>
      assertP.equal( Stream.seq([1,3,7,21], 0, 50).all( x => !(x % 2) ), false )
    )
  )
  
  describe('#concat()', () =>
    it('should yield ([1,2,3,4,5], 20ms, 20ms) from 2 concatenated sequences ([1,2],20ms,50ms) and ([3,4,5], 120ms,50ms)', () =>
      assertS.seq( 
        Stream.seq([1,2], 20, 50).concat( Stream.seq([3,4,5], 120,20) ), 
        [1,2,3,4,5], 20, 20 )
    )
  )
  
  describe('#merge()', () =>
    it('should yield ([1,2,3,4,5], 20ms, 50ms) from 2 merged sequences ([1,3,5],0ms,50ms) and ([2,4], 25ms,50ms)', () =>
      assertS.seq( 
        Stream.seq([1,3,5], 0, 50).merge( Stream.seq([2,4], 25,50) ), 
        [1,2,3,4,5], 0, 25)
    )
  )
  
  describe('#flatMap()', () =>
    it('should yield ([1,1,2,1,2,3], 0ms, 50ms)', () =>
      assertS.seq( 
        Stream.seq([1,2,3], 0, 50).flatMap( n => Stream.range(1, n, Math.max(0, n-2)*50, 50) ), 
        [1,1,2,1,2,3], 0, 50)
    )
  )
  
  describe('#zip()', () =>
    it('should yield ([ [1,"a"], [2,"b"] ], 25ms, 50ms) from ([1,2,3],0,50ms) and (["a","b"], 25ms, 50ms)', () =>
      assertS.seq( 
        Stream.seq([1,2,3], 0, 50).zip( Stream.seq(['a', 'b'], 25, 50) ), 
        [ [1,'a'], [2,'b'] ], 25, 50)
    )
  )
  
  describe('#zipWith()', () =>
    it('should yield ([12,14,16], 0ms, 50ms) from ([1,2,3],0,50ms) and ([11,12,13], 25ms, 50ms)', () =>
      assertS.seq( 
        Stream.seq([1,2,3], 0, 50).zipWith( Stream.seq([11,12,13], 25, 50), (x, y) => x + y ), 
        [ 12,14,16 ], 25, 50)
    )
  )
  
})