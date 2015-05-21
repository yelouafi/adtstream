import Stream from "../stream";
import { emitterOnce } from '../utils';
import _ from './common';

Stream.fromEmitter = function (emitter, event, untilP) {
  return Stream.bind(
    listener => emitter.on(event, listener),
    listener => emitter.removeListener(event, listener),
    untilP
  );
};

Stream.fromReadable = function (readable) {
  return Stream.fromEmitter(
    readable,
    'data',
    emitterOnce(readable, 'end', 'error')
  );
};

var Readable = require('stream').Readable,
      util = require('util');

util.inherits(ReadableAdts, Readable);

function ReadableAdts(adts, opt) {
  Readable.call(this, opt);
  this.adts = adts;
}

ReadableAdts.prototype._read = function() {
  var me = this;
  read();
  
  function read() {
    if(me.adts.isEmpty)
      return me.push(null);
    
    if(me.adts.isAbort)
      me.emit('error', me.adts.error);
      
    if(me.adts.isCons) {
      var head = me.adts.head;
      me.adts = me.adts.tail;
      me.push(head);
    } 
    
    if(me.adts.isFuture) {
      me.adts.promise.then( s => {
        me.adts = s;
        read();
      });
    }
  }
};

      
Stream.prototype.toReadable = function (opt) {
  var r = new ReadableAdts(this, opt);
  r.setEncoding('utf8');
  return r;
};
