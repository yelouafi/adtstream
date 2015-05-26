'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _stream = require('../stream');

var _stream2 = _interopRequireDefault(_stream);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

var dom = function dom(target) {
  return typeof target === 'string' ? document.querySelector(target) : target;
};

function eachKey(obj, f) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) f(key, obj[key]);
  }
}

_stream2['default'].fromDomEvent = function (target, event, untilP) {
  target = dom(target);
  return _stream2['default'].bind(function (listener) {
    return target.addEventListener(event, listener);
  }, function (listener) {
    return target.removeEventListener(event, listener);
  }, untilP);
};

utils.nextDOMEvent = function (target, event) {
  target = dom(target);

  return new Promise(function (res, rej) {
    var listener = function listener(e) {
      target.removeEventListener(listener);
      res(e);
    };
    target.addEventListener(event, listener);
  });
};

var props = {
  $$def: function $$def(key) {
    return function (el, v) {
      return el[key] = v.toString();
    };
  },
  text: function text(el, v) {
    return el.textContent = v.toString();
  },
  html: function html(el, v) {
    return el.innerHTML = v.toString();
  },
  disabled: function disabled(el, v) {
    return el.disabled = !!v;
  },
  enabled: function enabled(el, v) {
    return el.disabled = !v;
  },
  visible: function visible(el, v) {
    return !v ? el.style.display = 'none' : el.style.removeProperty('display');
  },
  css: function css(el, v) {
    return eachKey(v, function (cls, toggle) {
      if (toggle instanceof _stream2['default']) toggle.forEach(function (v) {
        return el.classList.toggle(cls, !!v);
      });else el.classList.toggle(cls, toggle);
    });
  }
};

utils.$update = function (target, config) {
  target = dom(target);

  eachKey(config, function (key, val) {
    var fn = props[key] || props.$$def(key);
    if (val instanceof _stream2['default']) val.forEach(function (v) {
      return fn(target, v);
    });else fn(target, val);
  });
};