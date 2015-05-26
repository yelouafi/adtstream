import { Stream } from "../src"

function simpleProtocol(src) {
  
  var [header1, body1] = src.break( t => t.indexOf("\n\n") >= 0 ),
      chunks = body1.first().then( t => t.split("\n\n") ),
      ch1 = chunks.then( ts => Stream.unit(ts[0]) ),
      ch2 = chunks.then( ts => Stream.unit(ts[1]) ),
      header = header1.concat( Stream.Future(ch1) ) 
      body = Stream.Future(ch2).concat(body1)
  
  return [ header, body ]
}

var [header, body] = simpleProtocol( Stream.array(['header 1, hea', 'der 2\n\nBody te', 'xt an', 'oth\n\ner body']) )

header.log('header')
body.log('body')
