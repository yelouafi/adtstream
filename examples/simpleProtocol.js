import { Stream, utils } from "../src"

function simpleProtocol(src) {
  
  var found, prec = '';
  return src.flatMap( s =>  {
    if(found)
      return Stream.array([prec+s]);
      
    var parts = s.split('\n\n');
    if(parts.length < 2) {
      prec += s;
      return Stream.Empty;
    } else {
      found = true;
      var s = Stream.array( [prec + parts[0]].concat( parts.slice(1) ) )
      prec = '';
      return s;
    }
    
  });
}

simpleProtocol( Stream.array(['header 1, hea', 'der 2\n\nBody te', 'xt an', 'oth\n\ner body']) ).log()