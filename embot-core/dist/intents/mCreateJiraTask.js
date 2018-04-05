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
var Base64 = require("base-64");
var micro_1 = require("micro");
var node_fetch_1 = require("node-fetch"), Fetch = node_fetch_1;
var Env = require("require-env");
var JIRA_BASE_URL = Env.require('JIRA_BASE_URL');
var JIRA_USERNAME = Env.require('JIRA_USERNAME');
var JIRA_PASSWORD = Env.require('JIRA_PASSWORD');
module.exports = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var input, user, issue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, micro_1.json(req)];
            case 1:
                input = _a.sent();
                return [4, jiraUserRequest(input.userEmail)];
            case 2:
                user = _a.sent();
                return [4, jiraIssueRequest(input, user)];
            case 3:
                issue = _a.sent();
                res.end('Here is the issue I created: ```' +
                    (JIRA_BASE_URL + "/browse/" + issue.key) +
                    '```');
                return [2];
        }
    });
}); };
function jiraUserRequest(email) {
    return __awaiter(this, void 0, void 0, function () {
        var rq, rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rq = buildJiraUserRequest(email);
                    return [4, node_fetch_1["default"](rq)];
                case 1:
                    rs = _a.sent();
                    return [2, handleJiraUserResponse(rs)];
            }
        });
    });
}
function buildJiraUserRequest(email) {
    return new Fetch.Request(JIRA_BASE_URL + "/rest/api/2/user/search?username=" + email, {
        method: 'GET',
        headers: defaultJiraHeaders()
    });
}
function handleJiraUserResponse(rs) {
    return __awaiter(this, void 0, void 0, function () {
        var users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rs.json()];
                case 1:
                    users = _a.sent();
                    if (users.length === 0) {
                        return [2, { name: JIRA_USERNAME }];
                    }
                    return [2, users[0]];
            }
        });
    });
}
function jiraIssueRequest(input, user) {
    return __awaiter(this, void 0, void 0, function () {
        var rq, rs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rq = buildJiraIssueRequest(input, user);
                    return [4, node_fetch_1["default"](rq)];
                case 1:
                    rs = _a.sent();
                    return [2, handleJiraIssueRequest(rs)];
            }
        });
    });
}
function buildJiraIssueRequest(input, user) {
    var body = {
        fields: {
            project: {
                key: input.lexOutput.slots.project
            },
            summary: input.lexOutput.slots.summary,
            description: "\"" + input.lexOutput.slots.summary + "\"\n\nIssue created by EmBot",
            reporter: {
                name: user.name
            },
            assignee: {
                name: 'brucej'
            },
            issuetype: {
                name: 'Task'
            },
            priority: {
                name: 'Low'
            },
            timetracking: {
                originalEstimate: '1h',
                remainingEstimate: '1h'
            },
            duedate: calculateDueDate(),
            customfield_11600: {
                id: '11300'
            },
            customfield_11500: {
                value: 'SpinDance'
            }
        }
    };
    return new Fetch.Request(JIRA_BASE_URL + "/rest/api/2/issue", {
        method: 'POST',
        headers: defaultJiraHeaders(),
        body: JSON.stringify(body)
    });
}
function handleJiraIssueRequest(rs) {
    return __awaiter(this, void 0, void 0, function () {
        var issue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rs.json()];
                case 1:
                    issue = _a.sent();
                    console.log(JSON.stringify(issue));
                    return [2, issue];
            }
        });
    });
}
function defaultJiraHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': "Basic " + Base64.encode(JIRA_USERNAME + ":" + JIRA_PASSWORD)
    };
}
function calculateDueDate() {
    var d = new Date();
    var dayOfMonth = d.getDate();
    d.setDate(dayOfMonth + 7);
    return d.toISOString();
}
