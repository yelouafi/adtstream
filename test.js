var http = require("http")

var server = http.createServer( (req, res) => req.pipe(res) )

server.listen(1337)