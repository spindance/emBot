"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var micro_1 = require("micro");
var node_fetch_1 = require("node-fetch"), Fetch = node_fetch_1;
var Env = require("require-env");
var CALENDAR_URL = Env.require('CALENDAR_INTERFACE_URL');
module.exports = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var body, text;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, micro_1.json(req)];
            case 1:
                body = _a.sent();
                return [4, calendarRequest(body)];
            case 2:
                text = _a.sent();
                micro_1.send(res, 200, { type: 'plain_text', text: text });
                return [2];
        }
    });
}); };
function calendarRequest(b) {
    return __awaiter(this, void 0, void 0, function () {
        var rq, rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rq = buildCalendarRequest(b.lexOutput.slots);
                    return [4, node_fetch_1["default"](rq)];
                case 1:
                    rs = _a.sent();
                    return [2, handleCalendarResponse(b.lexOutput.slots.room, rs)];
            }
        });
    });
}
function buildCalendarRequest(slots) {
    return new Fetch.Request(CALENDAR_URL + "/", {
        method: 'POST',
        body: JSON.stringify(slots),
        headers: { 'Content-Type': 'application/json' }
    });
}
function handleCalendarResponse(room, rs) {
    return __awaiter(this, void 0, void 0, function () {
        var events, fe, firstStartTime, time, nextFreeTime, _i, events_1, e, startTime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rs.json()];
                case 1:
                    events = _a.sent();
                    if (events.length === 0) {
                        return [2, room + " is available for the rest of the day."];
                    }
                    fe = events[0];
                    firstStartTime = new Date(fe.start.dateTime);
                    if (firstStartTime.valueOf() > Date.now()) {
                        time = timeInZone(firstStartTime);
                        return [2, room + " is available until " + time + "."];
                    }
                    nextFreeTime = firstStartTime;
                    for (_i = 0, events_1 = events; _i < events_1.length; _i++) {
                        e = events_1[_i];
                        startTime = new Date(e.start.dateTime);
                        if (nextFreeTime.valueOf() === startTime.valueOf()) {
                            nextFreeTime = new Date(e.end.dateTime);
                        }
                        else {
                            break;
                        }
                    }
                    return [2, fe.creator.displayName + " has booked " + room + " for " + fe.summary + ". It will be available at " + timeInZone(nextFreeTime) + "."];
            }
        });
    });
}
function timeInZone(d) {
    return d.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short'
    });
}
