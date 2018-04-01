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
var google_auth_library_1 = require("google-auth-library");
var micro_1 = require("micro");
var EIGHT_HOURS = 8 * 60 * 60 * 1000;
var GCAL_ENDPOINT = 'https://www.googleapis.com/calendar/v3';
var CLIENT = new google_auth_library_1.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
    scopes: 'https://www.googleapis.com/auth/calendar.readonly'
});
module.exports = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var body, calendars, eventLists, events;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, CLIENT.authorize()];
            case 1:
                _a.sent();
                return [4, micro_1.json(req)];
            case 2:
                body = _a.sent();
                return [4, requestCalendars(CLIENT)];
            case 3:
                calendars = _a.sent();
                return [4, Promise.all(calendars.items
                        .filter(function (cal) {
                        return body.roomName === undefined || body.roomName === cal.summary;
                    })
                        .map(function (cal) {
                        return requestEvents(CLIENT, cal);
                    }))];
            case 4:
                eventLists = _a.sent();
                events = eventLists.reduce(function (acc, el) {
                    return acc.concat(el.items);
                }, []);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(events));
                return [2];
        }
    });
}); };
function requestCalendars(c) {
    return __awaiter(this, void 0, void 0, function () {
        var url, params, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = GCAL_ENDPOINT + "/users/me/calendarList";
                    params = {
                        fields: 'items(id,summary)'
                    };
                    return [4, c.request({ url: url, params: params })];
                case 1:
                    r = _a.sent();
                    return [2, r.data];
            }
        });
    });
}
function requestEvents(cli, cal) {
    return __awaiter(this, void 0, void 0, function () {
        var url, min, max, params, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = GCAL_ENDPOINT + "/calendars/" + cal.id + "/events";
                    min = new Date();
                    max = new Date(min.valueOf() + EIGHT_HOURS);
                    params = {
                        fields: 'items(creator/displayName,end/dateTime,location,start/dateTime,summary),summary',
                        orderBy: 'startTime',
                        singleEvents: true,
                        timeMin: min.toISOString(),
                        timeMax: max.toISOString()
                    };
                    return [4, cli.request({ url: url, params: params })];
                case 1:
                    r = _a.sent();
                    return [2, r.data];
            }
        });
    });
}
