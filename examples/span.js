import { Stream } from "../src"

var pair = Stream.array([1,2,3,4,5,6,7,8,9]).span( x => x < 3)
    pair[0].log('< 3')
    pair[1].log('>= 3')