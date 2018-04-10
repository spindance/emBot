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
var node_fetch_1 = require("node-fetch"), Fetch = node_fetch_1;
var micro_1 = require("micro");
var Env = require("require-env");
var client_1 = require("@slack/client");
var Lex = require("./lex");
var BOT_CORE_URL = Env.require('CORE_URL');
var SLACK_OUT_URL = Env.require('SLACK_OUT_URL');
var LEX_BOT_VERSION = Env.require('LEX_BOT_VERSION');
var SECRET_TOKEN = Env.require('SLACK_SECRET_TOKEN');
var API_TOKEN = Env.require('SLACK_API_TOKEN');
var lexBot = new Lex.LexBot('emBot', LEX_BOT_VERSION);
var slackWeb = new client_1.WebClient(API_TOKEN);
module.exports = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var body, _a, msg, lRes, email, rs;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4, micro_1.json(req)];
            case 1:
                body = _b.sent();
                if (body.token !== SECRET_TOKEN) {
                    micro_1.send(res, 403, 'unauthorized');
                    return [2];
                }
                _a = body.type;
                switch (_a) {
                    case 'url_verification': return [3, 2];
                    case 'interactive_message': return [3, 3];
                    case 'event_callback': return [3, 4];
                }
                return [3, 11];
            case 2:
                micro_1.send(res, 200, { challenge: body.challenge });
                return [3, 11];
            case 3:
                micro_1.send(res, 200);
                return [3, 11];
            case 4:
                micro_1.send(res, 200);
                msg = body;
                if (msg.event.subtype === 'bot_message') {
                    return [2];
                }
                return [4, lexBot.postText(msg.event.text, msg.event.user)];
            case 5:
                lRes = _b.sent();
                if (!(lRes.dialogState === 'ReadyForFulfillment')) return [3, 9];
                return [4, lookupSlackEmail(msg.event.user)];
            case 6:
                email = _b.sent();
                return [4, coreRequest(lRes, email, '')];
            case 7:
                rs = _b.sent();
                return [4, slackOutRequest(msg.event.channel, rs)];
            case 8:
                _b.sent();
                return [3, 11];
            case 9: return [4, slackOutRequest(msg.event.channel, lRes.message)];
            case 10:
                _b.sent();
                _b.label = 11;
            case 11: return [2];
        }
    });
}); };
function lookupSlackEmail(userID) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, slackWeb.users.info({ user: userID })
                    .then(function (data) {
                    var user = data.user;
                    return user.profile.email;
                })];
        });
    });
}
function coreRequest(l, userEmail, channel) {
    return __awaiter(this, void 0, void 0, function () {
        var rq, rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rq = buildCoreRequest(l, userEmail, channel);
                    return [4, node_fetch_1["default"](rq)];
                case 1:
                    rs = _a.sent();
                    return [2, handleCoreResponse(rs)];
            }
        });
    });
}
function buildCoreRequest(lexOutput, userEmail, channel) {
    var url = BOT_CORE_URL + "/" + lexOutput.intentName;
    var body = { lexOutput: lexOutput, userEmail: userEmail, channel: channel };
    return new Fetch.Request(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    });
}
function handleCoreResponse(rs) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, rs.json()];
        });
    });
}
function slackOutRequest(channel, input) {
    return __awaiter(this, void 0, void 0, function () {
        var rq, rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rq = buildSlackOutRequest(channel, input);
                    return [4, node_fetch_1["default"](rq)];
                case 1:
                    rs = _a.sent();
                    return [2, rs.ok];
            }
        });
    });
}
function buildSlackOutRequest(channel, input) {
    var url = SLACK_OUT_URL;
    var body;
    if (typeof input === 'string') {
        body = { type: 'plain_text', channel: channel, text: input };
    }
    else {
        body = Object.assign({ channel: channel }, input);
    }
    return new Fetch.Request(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    });
}
