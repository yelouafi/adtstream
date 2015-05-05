# ADTStreams

See [Blog Post]

Streams built using the following ingredients

- Promises
- Algebraic Data Types (ADT) 
- Pure FP (Haskell like) code. 

Thus the name *ADT Streams*.

They can be programmed just like any other recursive ADT by pattern matching and recursion.

# Transpiling ES6 sources

There are already compiled js files in the destination folders so you can skip the compile stage

- for the server, in the `lib` directory
- for the browser, in the `bundle` directory


Requirements

- Node.js (or iojs)
- Install [Babel][1] : `npm install -g babel` in order to compile the ES6 code
- Run the following commands
    - `npm run compile` to compile for Node.js, the compiled code will go to the `lib` directory
    - `npm run bundle`to compile for the browser, compiled code in the `bundle`directory

In the browser, The `Stream` class is exposed in the global scope (for uses outside browserify)

In the server, you can play with the examples in the `examples` directory, you can run the ES6 file directly by

`babel-node examples/[file.js]`

This will compile the code in the fly and execute it.

# ES6 Promise polyfill

##Server environments

The server build uses the [`es6-promise`][2] polyfill to provide support for Promises because actual stable versions of Node don't support Promise yet.

If you are using a server with native Promise support (iojs or latest Node version with --harmony flag) you can remove the first 2 lines from `src/promise-utils.js`.

##Browser environment

In the browser build the polyfill is deactivated by default (see the browser field in package.json). 

If you are using Chrome and Firefox you don't need to polyfill. Otherwise, you can check Promise support for your browser in [this site][3]

If you need to provide your own Promise support in the browser you can either 

- remove the "es6-promise": false from package.json/browser field, or
- use a compliant Promise/A+ library, or
- Better if you can, use a modern browser



[1]: https://babeljs.io/docs/usage/cli/
[2]: https://github.com/jakearchibald/es6-promise
[3]: https://kangax.github.io/compat-table/es6/