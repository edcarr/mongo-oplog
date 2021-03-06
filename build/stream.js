"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mongodb = require("mongodb");

var _filter = require("./filter");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(_ref2) {
        var time = function () {
            var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                var doc;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!ts) {
                                    _context.next = 2;
                                    break;
                                }

                                return _context.abrupt("return", typeof ts !== "number" ? ts : (0, _mongodb.Timestamp)(0, ts));

                            case 2:
                                _context.next = 4;
                                return coll.find({}, { ts: 1 }).sort({ $natural: -1 }).limit(1).nextObject();

                            case 4:
                                doc = _context.sent;
                                return _context.abrupt("return", doc ? doc.ts : (0, _mongodb.Timestamp)(0, Date.now() / 1000 | 0));

                            case 6:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            return function time() {
                return _ref3.apply(this, arguments);
            };
        }();

        var db = _ref2.db,
            ns = _ref2.ns,
            ts = _ref2.ts,
            coll = _ref2.coll;
        var query;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (db) {
                            _context2.next = 2;
                            break;
                        }

                        throw new Error("Mongo db is missing.");

                    case 2:
                        query = {};

                        coll = db.collection(coll || "oplog.rs");

                        if (ns) query.ns = { $regex: (0, _filter.regexArray)(ns) };
                        _context2.next = 7;
                        return time();

                    case 7:
                        _context2.t0 = _context2.sent;
                        query.ts = {
                            $gt: _context2.t0
                        };
                        _context2.next = 11;
                        return coll.find(query, {
                            tailable: true,
                            awaitData: true,
                            oplogReplay: true,
                            noCursorTimeout: true,
                            numberOfRetries: Number.MAX_VALUE
                        });

                    case 11:
                        return _context2.abrupt("return", _context2.sent.stream());

                    case 12:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, undefined);
    }));

    return function (_x) {
        return _ref.apply(this, arguments);
    };
}();