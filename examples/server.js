import { Stream, utils } from "../src"
import http from "http"



var server = http.createServer(server);

var listening = utils.emitterOnce(server, 'listening');
var requests = Stream.fromEmitter(server, 'request')

server.listen(1338);


requests.map( ([req,res]) => {
    req.setEncoding('utf8')
    return Stream.fromReadable(req).toArray();
}).log('get');
listening.then( _ => console.log('got a connection'));
