import { Stream } from "../src"

Stream.seq(['Hello', 'ADT', 'Streams'], 0, 1000).join().then( s => console.log(s) )