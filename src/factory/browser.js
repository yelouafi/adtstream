import Stream from '../stream';
import _ from './common';
import * as utils from "../utils";

var dom = target => typeof target === 'string' ? document.querySelector(target) : target;

function eachKey(obj, f) {
  for(var key in obj) {
    if( obj.hasOwnProperty(key) )
      f(key, obj[key]);  
  }
}

Stream.fromDomTarget = function (target, event, untilP) {
  target = dom(target);
  return Stream.bind(
    listener => target.addEventListener(event, listener),
    listener => target.removeEventListener(event, listener),
    untilP
  );
};

utils.nextDOMEvent = function (target, event) {
  target = dom(target);
  
  return new Promise((res, rej) => {
    var listener = e => {
      target.removeEventListener(listener);
      res(e);
    };
    target.addEventListener(event, listener );
  });
};

var props = {
  text      : (el, v) => el.textContent = v.toString(),
  html      : (el, v) => el.innerHTML = v.toString(),
  disabled  : (el, v) => el.disabled = !!v,
  enabled   : (el, v) => el.disabled = !v,
  visible   : (el, v) => !v ? el.style.display = 'none' : el.style.removeProperty('display')
};

utils.$update = function (target, config) {
  target = dom(target);
  
  eachKey(config, (key, val) => {
    if(val instanceof Stream)
      val.forEach( v => target[key] = v );
    else
      target[key] = val;
  });
  
};