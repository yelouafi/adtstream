# ADTStreams

See [Blog Post]

Streams built using Algebraic Data Types (ADT) and Pure FP (Haskell like) code. Thus the name *ADT Streams*.

They can be programmed just like any other recursive ADT by pattern matching

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



[1]: https://babeljs.io/docs/usage/cli/