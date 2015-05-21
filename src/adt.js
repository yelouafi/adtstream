'use strict';

function eachKey(obj, f) {
  for(var key in obj) {
    if( obj.hasOwnProperty(key) )
      f(key, obj[key]);  
  }
}
 
function adtcase (base, proto, key) {
  return (...args) => {
    var inst = new base();
    eachKey(proto(...args), (key, val) => { inst[key] = val });
    inst['is'+key] = true;
    return inst;
  };
}
 
function adt(base, variants) {
  eachKey(variants, (key, v) => {
    if(typeof v === 'function')
      base[key] = adtcase(base, v, key);
    else {
      base[key] = v;
      v['is'+key] = true;
    }
  });
}

export default adt;