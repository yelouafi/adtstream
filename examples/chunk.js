/*global Stream Promise */
import { Stream } from "../src"

// create chunks on line boundaries

Stream.seq(['line 1\nline ', '2\nline3\n', 'line 4', ' still long\nline 5', '\nand this is a new line'], 0, 1000)
        .chunkBy( '', (prec, s) => {
          var lines = s.split('\n'), 
              head = lines[0],
              last = lines.length - 1;
              
          return (last > 0) ?
            [ Stream.array([].concat(prec + head, lines.slice(1, last))), Promise.resolve(lines[last]) ] :
            [ Stream.Empty, Promise.resolve(prec + head) ];
        })
        .log()
    
//logP(group, 'group');