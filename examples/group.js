import Stream from "../src/stream"

Stream.seq(['a', 'a', 'f', 'd', 'd', 'e'], 0, 1000)
        .group()
        .asyncMap( group => group.toArray() )
        .log()