import { Stream } from "../src"

var pair = Stream.range(1, 10, 0, 1000).span( x => x < 3)
    pair[0].log('< 3')
    pair[1].log('>= 3')