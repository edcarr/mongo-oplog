"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.regex = regex;
exports.regexArray = regexArray;

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _ = require("./");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function regex(pattern) {
    pattern = pattern || "*";
    pattern = pattern.replace(/[*]/g, "(.*?)");
    return new RegExp("^" + pattern + "$", "i");
}

function regexArray(patterns) {
    var pattern = "*";
    if (patterns && patterns.length > 0) {
        pattern = patterns.join("$|^");
    }
    pattern = pattern.replace(/[*]/g, "(.*?)");
    return new RegExp("^" + pattern + "$", "i");
}

exports.default = function (ns, oplog) {
    var debug = (0, _debug2.default)("mongo-oplog:filter");
    var filter = new _eventemitter2.default();
    var re = regexArray(ns);

    debug("initializing filter with re %s", ns);

    function onop(doc) {
        if (!re.test(doc.ns) || filter.ignore) return;
        debug("incoming data %j", doc);
        filter.emit("op", doc);
        filter.emit(_.events[doc.op], doc);
    }

    function destroy() {
        debug("removing filter bindings");
        oplog.removeListener("op", onop);
        filter.removeAllListeners();
    }

    oplog.on("op", onop);

    return Object.assign(filter, { destroy: destroy });
};