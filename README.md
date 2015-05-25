See [Blog Post: Promises + FP = Beautiful Streams][4]

Streams built using the following ingredients

- Promises
- Algebraic Data Types (ADT) 

Hence the name *ADT Streams*.

# Usage

In the server, install from npm

    npm install adtstream
    
Then import

    var Stream = require("adtstream").Stream;
    
Using the ES6 module syntax

    import { Stream } from "adtstream";
    
In Node, you can create a stream from redeable Node stream

    Stream.fromReadable( fs.createReadStream('test.txt') ).log('file')

You can also create a Stream from a Node EventEmitter

    var server = http.createServer();
    Stream.fromEmitter(server, 'request')
    
Using the generic `Stream.bind()` method you can implement your own stream

    Stream.bind(subscribe, unsubscribe, untilP)
    
The function subscribes to an event source using the 1st argument, and yields results from the event source until the ending promise (the 3rd argument) completes then unsubscribes using the 2nd argument

For example here is how Streams are built from DOM events

    Stream.fromDomTarget = function (target, event, untilP) {
      return Stream.bind(
        listener => target.addEventListener(event, listener),
        listener => target.removeEventListener(event, listener),
        untilP
      );
    };

In the browser the bundle exposes a global `adts` variable, so you can use it like

    var Stream = adts.Stream;
    
Then you can create streams from dom events with the helper method `$on`

    adts.$on(document, 'keydown').filter( e => e.keyCode === 17 ).log('key')
    
You can also use selectors in place of DOM objects

    adts.$on('#button', 'click').log('click')
    
There is another utility method `$once` to get a Promise holding the next event occurrence

    adts.$once(document, 'click').then( e => console.log(e) )
    
For example you can combine `$on` and `$once` to create finite event streams

    adts.$on( document, 'mousemove', adts.$once('#stopButton', 'click') )
    
You can also use the timeout utility method `delay` to limit the event stream by a given delay (in milliseconds)

    adts.$on( document, 'click', adts.utils.delay(1, 10000) ).log()

# Transpiling ES6 sources

`npm install` to install dependencies; this will install dev dependencies `Babel` for ES6 transpilation and `mocha` for unit tests

Run the following commands :  
- `npm run compile` to compile for Node.js, the compiled code will go to the `lib` directory  
- `npm run bundle` to compile for the browser, compiled code go to the `bundle`directory

Or simply use `npm run build` to execute both commands.

In the server, you can run the ES6 examples in the `examples` directory directly by

`babel-node examples/[file.js]`

This will compile the code in the fly and execute it.

# ES6 Promise polyfill

##Server environments

The server build uses the [`es6-promise`][2] polyfill to provide support for Promises (because actual stable versions of Node don't support Promise yet).

If you are using a server with native Promise support (iojs or latest Node version with --harmony flag) you can remove the first 2 lines from `src/utils.js`.

##Browser environments

In the browser build the polyfill is deactivated by default (see the browser field in package.json). 

If you are using Chrome and Firefox you don't need to polyfill. Otherwise, you can check Promise support for your browser in [this site][3]

If you need to provide your own Promise support in the browser you can either 

- remove the "es6-promise": false from package.json/browser field, or
- use a compliant Promise/A+ library, or



[1]: https://babeljs.io/docs/usage/cli/
[2]: https://github.com/jakearchibald/es6-promise
[3]: https://kangax.github.io/compat-table/es6/
[4]: http://tech.pro/blog/6888/promises--fp--beautiful-streams