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

Stream.fromDomEvent = function (target, event, untilP) {
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

var props = utils.$vprops = {
  $$def     : key => el => v => el[key] = v,
  text      : el => v => el.textContent = v.toString(),
  html      : el => v => el.innerHTML = v.toString(),
  disabled   : el => v => el.disabled = !!v,
  enabled   : el => v => el.disabled = !v,
  visible   : el => v => !v ? el.style.display = 'none' : el.style.removeProperty('display'),
  css       : el => v => eachKey(v, (cls, toggle) => {
    if(toggle instanceof Stream)
      toggle.forEach( v => el.classList.toggle(cls, !!v) );
    else
      el.classList.toggle(cls, toggle);
  })
};

utils.$update = function (target, config) {
  target = dom(target);
  
  eachKey(config, (key, val) => {
    let fn = (props[key] || props.$$def(key))(target);
    if(val instanceof Stream)
      val.forEach(fn);
    else
      fn(val);
  });
  
};