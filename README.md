See [Blog Post]

Streams built using the following ingredients

- Promises
- Algebraic Data Types (ADT) 

Hence the name *ADT Streams*.

# Usage

In the server, install from npm

    npm install adts
    
Then import

    var Stream = require("adts").Stream;
    
Using the ES6 module syntax

    import { Stream } from "adts";

In the browser the bundle exposes a global `adts` variable, so you can use it like

    var Stream = adts.Stream;
    

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