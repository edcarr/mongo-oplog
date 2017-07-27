import Emitter from "eventemitter3";
import dbg from "debug";
import { events } from "./";

export function regex(pattern) {
    pattern = pattern || "*";
    pattern = pattern.replace(/[*]/g, "(.*?)");
    return new RegExp(`^${pattern}$`, "i");
}

export function regexArray(patterns) {
    let pattern = "*";
    if (patterns && patterns.length > 0) {
        pattern = patterns.join("$|^");
    }
    pattern = pattern.replace(/[*]/g, "(.*?)");
    return new RegExp(`^${pattern}$`, "i");
}

export default (ns, oplog) => {
    const debug = dbg("mongo-oplog:filter");
    const filter = new Emitter();
    const re = regexArray(ns);

    debug("initializing filter with re %s", ns);

    function onop(doc) {
        if (!re.test(doc.ns) || filter.ignore) return;
        debug("incoming data %j", doc);
        filter.emit("op", doc);
        filter.emit(events[doc.op], doc);
    }

    function destroy() {
        debug("removing filter bindings");
        oplog.removeListener("op", onop);
        filter.removeAllListeners();
    }

    oplog.on("op", onop);

    return Object.assign(filter, { destroy });
};
