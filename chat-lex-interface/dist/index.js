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
var AWS = require("aws-sdk");
var Crypto = require("crypto");
var micro_1 = require("micro");
var Hangouts = require("./hangouts");
var example = require('./hangouts/cardExample');
var botVersion = process.env.BOT_VERSION || 'latest';
var secretToken = process.env.HANGOUTS_SECRET_TOKEN;
var lexruntime = new AWS.LexRuntime({
    region: 'us-east-1'
});
module.exports = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var body, _a, b, eventID, lRes, b, params, lRes;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4, micro_1.json(req)];
            case 1:
                body = _b.sent();
                if (body.token !== secretToken) {
                    res.writeHead(403);
                    res.end('unauthorized');
                    return [2];
                }
                _a = body.type;
                switch (_a) {
                    case Hangouts.EventType.ADDED: return [3, 2];
                    case Hangouts.EventType.CARD: return [3, 3];
                    case Hangouts.EventType.MESSAGE: return [3, 4];
                }
                return [3, 6];
            case 2:
                {
                    res.end('{"text": Thanks for adding me!"}');
                    return [2];
                }
                _b.label = 3;
            case 3:
                {
                    b = body;
                    eventID = b.action.parameters.filter(function (p) { return p.key === 'eventID'; })[0].value;
                    lRes = {
                        dialogState: 'ReadyForFulfillment',
                        intentName: b.action.actionMethodName,
                        message: null,
                        slots: {
                            eventID: eventID
                        }
                    };
                    res.end('{"text": "Ok."}');
                    return [2];
                }
                _b.label = 4;
            case 4:
                b = body;
                if (b.message.text.includes('zenoss')) {
                    res.end(JSON.stringify(example));
                    return [2];
                }
                params = buildLexParams(b);
                return [4, postLex(params)];
            case 5:
                lRes = _b.sent();
                if (lRes.dialogState === 'ReadyForFulfillment') {
                    res.end('{"text": "Ok."}');
                    return [2];
                }
                res.end(JSON.stringify({ text: lRes.message }));
                return [2];
            case 6:
                {
                    res.end('bye');
                }
                _b.label = 7;
            case 7: return [2];
        }
    });
}); };
function buildLexParams(h) {
    var hash = Crypto.createHash('sha256');
    hash.update(h.message.sender.displayName);
    return {
        botName: 'emBot',
        botAlias: botVersion,
        userId: hash.digest('hex'),
        inputText: h.message.text
    };
}
function postLex(i) {
    return new Promise(function (resolve, reject) {
        lexruntime.postText(i, function (err, data) {
            return (err)
                ? reject(err)
                : resolve(data);
        });
    });
}
