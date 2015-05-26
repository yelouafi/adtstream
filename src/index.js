import Stream from "./stream";
import _0 from "./factory/common";
import _1 from "./factory/server";
import _2 from "./factory/browser";
import * as utils from "./utils";

module.exports = {
    Stream : Stream,
    utils : utils,
    $on : Stream.fromDomEvent,
    $once : utils.nextDOMEvent,
    $$: utils.$update,
    $prop: (prop, handler) => {
        utils.$vprops[prop] = el => v => handler(el, v);
    } 
};