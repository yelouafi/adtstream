import { Stream, utils } from "../src"


var s = Stream.Cons("hi", Stream.Empty)

var p = utils.getLater( () => s, 2000)

Stream.Future( p ).toReadable().pipe(process.stdout)