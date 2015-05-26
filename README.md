See [Blog Post: Promises + FP = Beautiful Streams][4]

Streams built using the following ingredients

- Promises
- Algebraic Data Types (ADT) 

Hence the name *ADT Streams*.

- [Usage](#usage)
- [Examples](#examples)
- [API][5]
- [Transpiling ES6 sources](#transpiling-es6-sources)

#Usage

##Server

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

    Stream.fromDomEvent = function (target, event, untilP) {
      return Stream.bind(
        listener => target.addEventListener(event, listener),
        listener => target.removeEventListener(event, listener),
        untilP
      );
    };

##Browser

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
    
A common use case is to use the values from a stream to update some DOM element

    adts.$on('#addButton', 'click')
        .scan( (p,c) => p + 1 )
        .forEach( v => document.querySelector('#output').textContent = v );
    
The library provides a helper method `adts.$$` to express DOM updates declaratively (an alias for `adts.utils.$update`)
    
    adts.$$('#output', {
      textContent : adts.$on('#addButton', 'click').scan( (p,c) => p + 1 )
    })
    
There exists also a few additional goodies: *virtual properties* allow to encapsulate more elaborated updates.

    adts.$$('#elem', { 
      css: { 
        class1 : aStream // toggle class1 based on aStream incoming value  
      }
    });   // alias for target.disabled = !value
    adts.$$('#elem', { enabled: aStream });   // target.disabled = !!value
    adts.$$('#elem', { enabled: aStream });   // target.disabled = !value
    adts.$$('#elem', { text : aStream });     // alias for textContent
    adts.$$('#elem', { html : aStream });     // alias for innerHTML
    adts.$$('#elem', { text : aStream });     // alias for textContent
    adts.$$('#elem', { visible : aStream });  // alias for elem.style.display = 'none'/el.style.removeProperty('display')
    
You can add your own virtual properties using `adts.$prop(prop, handler)`

    adts.$prop('greeting', (elem, value) => elem.innerHTML = 'Hi ' + value )

  

#Examples

**1- classic up down**

We've 2 buttons: `up` and `down` and an output text on the page, each click on `up` adds 1 to the output result while each click on `down` substracts 1 from the result

HTML
```html
<button id="up">Up</button>
<button id="down">Down</button>
<p id="output"></p>
```

JavaScript
```javascript
document.addEventListener("DOMContentLoaded", function(event) {
  var ups = adts.$on("#up", "click").map( _ => 1 ),
      downs = adts.$on("#down", "click").map( _ => -1 ),
    
  adts.$$('#output', { 
    text: ups.merge(downs).scan( (p,c) => p+c ) 
  })
});
```

**2- Watchdog**

This is an example taken from the SIGNAL programming language (a dataflow langauge), Here is the description (taken from [The SIGNAL][6] paper

>>A process emits an ORDER, to be executed within some DELAY. When finished, a DONE
signal is made available. The WATCHDOG is designed to control this delay. It receives
a copy of ORDER and DONE signals. It must emit an ALARM whenever a job is not
finished in time

So we've 2 user commands : `ORDER` which initiates a new process, and `DOWN` which cancels an angoing process.
W'll suppose that once an ORDER is emitted, the user is not allowed to emit any other ORDER until he explicitly clicks on DOWN

HTML
```html
<p>
  <button id="order">Order</button> 
  <button id="done">Done</button>
</p>
<p>Timer <span id='timer' ></span></p>
<p>Counter <span id='counter' ></span></p>
<p id="alarm">Alarm <span  id="alarmText"></span></p>
```

JavaScript
```javascript
var Stream = adts.Stream;

function watchdog( delay, tick, order, done ) {
	var counter = 
	  order.const(0).merge( done.const(-1) ).merge( tick.const(1) )
  		.scan( (prev,cur) => {
  			return 	cur <= 0  ? cur : // c == -1 => pause process, c == 0 => starts new order
  							prev < 0 ? prev :   // a tick event ? if process paused (p < 0) ignore it
  							prev + cur;        // else add to counter
  		}, -1)

	
	return {
	  counter : counter,
	  alarm   : counter.map( c => c > delay ).changes(), // boolean state (delay depassed), skip duplaicates
	  paused  : counter.map( c => c == -1 ).changes()    // boolean state
	};
}

document.addEventListener("DOMContentLoaded", function(event) {
	
  var tick = Stream.seconds(1000),
      order = adts.$on('#order', 'click'),
      done = adts.$on('#done', 'click'),
      wd = watchdog( 5, tick, order, done ); // a process has to be terminated in 5 seconds

  adts.$$('#done', { disabled: wd.paused });
  adts.$$('#order', { enabled: wd.paused });
  adts.$$('#counter', { text: wd.counter });

  adts.$$('#timer', { 
    text: tick.scan( (p,c) => p+1, 0) 
  });
  
  adts.$$('#alarmText', {
    text: wd.alarm.combine(wd.counter , (alarm, counter) => alarm ? counter : 'NA'; })
  });
	
  adts.$$('#alarm', { 
    css: { blink: wd.alarm }  
  });
	
});
```


#Transpiling ES6 sources

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
[5]: https://github.com/yelouafi/adtstream/wiki/API
[6]: http://www.irisa.fr/espresso/Polychrony/document/tutorial.pdf
