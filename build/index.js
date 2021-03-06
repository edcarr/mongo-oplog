"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.events = undefined;

require("babel-polyfill");

var _eventemitter = require("eventemitter3");

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _mongodb = require("mongodb");

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _filter = require("./filter");

var _filter2 = _interopRequireDefault(_filter);

var _stream = require("./stream");

var _stream2 = _interopRequireDefault(_stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var MONGO_URI = "mongodb://127.0.0.1:27017/local";
var debug = (0, _debug2.default)("mongo-oplog");
var events = exports.events = {
    i: "insert",
    u: "update",
    d: "delete"
};

// Add callback support to promise
var toCb = function toCb(fn) {
    return function (cb) {
        try {
            var val = fn(cb);
            if (!cb) return val;else if (val && typeof val.then === "function") {
                return val.then(function (res) {
                    return cb(null, res);
                }).catch(cb); // eslint-disable-line
            }
            cb(null, val);
        } catch (err) {
            cb(err);
        }
    };
};

exports.default = function (uri) {
    var connect = function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!connected) {
                                _context.next = 2;
                                break;
                            }

                            return _context.abrupt("return", db);

                        case 2:
                            _context.next = 4;
                            return _mongodb.MongoClient.connect(uri, opts);

                        case 4:
                            db = _context.sent;

                            connected = true;

                        case 6:
                        case "end":
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        return function connect() {
            return _ref.apply(this, arguments);
        };
    }();

    var tail = function () {
        var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            _context2.prev = 0;

                            debug("Connected to oplog database");
                            _context2.next = 4;
                            return connect();

                        case 4:
                            _context2.next = 6;
                            return (0, _stream2.default)({ ns: ns, coll: coll, ts: ts, db: db });

                        case 6:
                            stream = _context2.sent;

                            stream.on("end", onend);
                            stream.on("data", ondata);
                            stream.on("error", onerror);
                            return _context2.abrupt("return", stream);

                        case 13:
                            _context2.prev = 13;
                            _context2.t0 = _context2["catch"](0);

                            onerror(_context2.t0);

                        case 16:
                        case "end":
                            return _context2.stop();
                    }
                }
            }, _callee2, this, [[0, 13]]);
        }));

        return function tail() {
            return _ref2.apply(this, arguments);
        };
    }();

    var stop = function () {
        var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            if (stream) stream.destroy();
                            debug("streaming stopped");
                            return _context3.abrupt("return", oplog);

                        case 3:
                        case "end":
                            return _context3.stop();
                    }
                }
            }, _callee3, this);
        }));

        return function stop() {
            return _ref3.apply(this, arguments);
        };
    }();

    var destroy = function () {
        var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            _context4.next = 2;
                            return stop();

                        case 2:
                            _context4.next = 4;
                            return db.close(true);

                        case 4:
                            connected = false;
                            return _context4.abrupt("return", oplog);

                        case 6:
                        case "end":
                            return _context4.stop();
                    }
                }
            }, _callee4, this);
        }));

        return function destroy() {
            return _ref4.apply(this, arguments);
        };
    }();

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var db = void 0;
    var stream = void 0;
    var connected = false;

    var ns = options.ns,
        since = options.since,
        coll = options.coll,
        opts = _objectWithoutProperties(options, ["ns", "since", "coll"]);

    var oplog = new _eventemitter2.default();

    var ts = since || 0;
    uri = uri || MONGO_URI;

    if (typeof uri !== "string") {
        if (uri && uri.collection) {
            db = uri;
            connected = true;
        } else {
            throw new Error("Invalid mongo db.");
        }
    }

    function filter(ns) {
        return (0, _filter2.default)(ns, oplog);
    }

    function ondata(doc) {
        if (oplog.ignore) return oplog;
        debug("incoming data %j", doc);
        ts = doc.ts;
        oplog.emit("op", doc);
        oplog.emit(events[doc.op], doc);
        return oplog;
    }

    function onend() {
        debug("stream ended");
        oplog.emit("end");
        return oplog;
    }

    function onerror(err) {
        if (/cursor (killed or )?timed out/.test(err.message)) {
            debug("cursor timeout - re-tailing %j", err);
            tail();
        } else {
            debug("oplog error %j", err);
            oplog.emit("error", err);
            throw err;
        }
    }

    return Object.assign(oplog, {
        db: db,
        filter: filter,
        tail: toCb(tail),
        stop: toCb(stop),
        destroy: toCb(destroy)
    });
};