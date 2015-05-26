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
