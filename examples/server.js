import { Stream, utils } from "../src"
import http from "http"



var server = http.createServer(server);

var listening = utils.emitterOnce(server, 'listening');
var requests = Stream.fromEmitter(server, 'request')

server.listen(1338);


requests.asyncMap( arr => {
    var req = arr[0],
        res = arr[1];
    console.log('async map')
    req.setEncoding('utf8')
    var body = Stream.fromReadable(req);
    body.toReadable().pipe(process.stdout);
    return body.toArray();
})//.log('get');
listening.then( _ => console.log('got a connection'));
//server.requests.log('server')