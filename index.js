"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
exports.__esModule = true;
/* tslint:disable:no-console */
var instagram_private_api_1 = require("instagram-private-api");
var config_json_1 = require("./config.json");
var stdout = process.stdout;
var stdin = process.stdin;
var PS1 = "> ";
var stdinBuffer = "";
var ig = new instagram_private_api_1.IgApiClient();
var broadcastId = "";
var streamTime = 0; // seconds
var viewerCount = 0;
var globalComments = [];
var pinnedCommentIndex = -1;
// TODO:
//     - implement pin()
var commandTable = {
    comment: function (strings) { return __awaiter(void 0, void 0, void 0, function () {
        var comment;
        return __generator(this, function (_a) {
            comment = "";
            strings.forEach(function (s) {
                if (s[0] === '\"') {
                    s = s.slice(1);
                }
                if (s[s.length - 1] === '\"') {
                    s = s.slice(0, -1);
                }
                comment += s + ' ';
            });
            comment = comment.trim();
            if (comment === "") {
                insertLine("[Error] This comment did not contain any text");
            }
            else {
                ig.live.comment(broadcastId, comment);
            }
            return [2 /*return*/];
        });
    }); },
    pin: function (argv) { return __awaiter(void 0, void 0, void 0, function () {
        var id, comment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = Number(argv[0]);
                    comment = globalComments[id];
                    if (!(comment !== undefined)) return [3 /*break*/, 5];
                    if (!(pinnedCommentIndex === id)) return [3 /*break*/, 2];
                    pinnedCommentIndex = -1;
                    return [4 /*yield*/, ig.live.unpinComment(broadcastId, comment.pk)];
                case 1:
                    _a.sent();
                    insertLine("[Unpinned comment]");
                    return [3 /*break*/, 4];
                case 2:
                    pinnedCommentIndex = id;
                    return [4 /*yield*/, ig.live.pinComment(broadcastId, comment.pk)];
                case 3:
                    _a.sent();
                    insertLine("[Pinned comment]");
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    insertLine("[Error] Invalid comment id");
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); },
    viewerList: function (_argv) { return __awaiter(void 0, void 0, void 0, function () {
        var users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ig.live.getViewerList(broadcastId)];
                case 1:
                    users = (_a.sent()).users;
                    insertLine("[Viewer list start]");
                    users.forEach(function (user) { return insertLine(user.username); });
                    insertLine("[Viewer list end]");
                    return [2 /*return*/];
            }
        });
    }); },
    end: function (_argv) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ig.live.endBroadcast(broadcastId)];
                case 1:
                    _a.sent();
                    insertLine("[Live ended]");
                    insertLine("[Exit]");
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    }); },
    help: function (_argv) {
        insertLine("[Available commands start]");
        Object.keys(commandTable).forEach(function (key) { return insertLine(key); });
        insertLine("[Available commands end]");
    }
};
function resolveTwoFA(err) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, username, totp_two_factor_on, two_factor_identifier, verificationMethod, code, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    insertLine("[Info] TwoFA enabled");
                    _a = err.response.body.two_factor_info, username = _a.username, totp_two_factor_on = _a.totp_two_factor_on, two_factor_identifier = _a.two_factor_identifier;
                    verificationMethod = totp_two_factor_on ? '0' : '1';
                    insertLine("Enter code received via " +
                        "".concat(verificationMethod === '1' ? 'SMS' : 'TOTP'));
                    _b.label = 1;
                case 1:
                    if (!!(stdinBuffer.length === 6 &&
                        /^[0-9\b]+$/.test(stdinBuffer))) return [3 /*break*/, 3];
                    return [4 /*yield*/, snooze(500)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 1];
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    code = stdinBuffer;
                    stdinBuffer = "";
                    insertLine("Verifying: " + code);
                    return [4 /*yield*/, ig.account.twoFactorLogin({
                            username: username,
                            verificationCode: code,
                            twoFactorIdentifier: two_factor_identifier,
                            verificationMethod: verificationMethod,
                            trustThisDevice: '1'
                        })];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    insertLine("[Error] " + error_1.message + '\n' + error_1.response);
                    console.error(error_1);
                    process.exit(1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function resolveChallenge() {
    return __awaiter(this, void 0, void 0, function () {
        var code, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ig.challenge.auto(true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ig.challenge.auto()];
                case 2:
                    _a.sent();
                    insertLine("Enter the 6 digit code sent to you");
                    _a.label = 3;
                case 3:
                    if (!!(stdinBuffer.length === 6 &&
                        /^[0-9\b]+$/.test(stdinBuffer))) return [3 /*break*/, 5];
                    return [4 /*yield*/, snooze(500)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    code = stdinBuffer;
                    stdinBuffer = "";
                    insertLine("Verifying: " + code);
                    return [4 /*yield*/, ig.challenge.sendSecurityCode(code)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    insertLine("[Error] " + error_2.message + '\n' + error_2.response);
                    console.error(error_2);
                    process.exit(1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function login() {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ig.state.generateDevice(config_json_1.account.username);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 11]);
                    return [4 /*yield*/, ig.account.login(config_json_1.account.username, config_json_1.account.password)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 3:
                    error_3 = _a.sent();
                    if (!(error_3 instanceof instagram_private_api_1.IgLoginBadPasswordError)) return [3 /*break*/, 4];
                    insertLine("[Error] Incorrect Username or Password");
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 4:
                    if (!(error_3 instanceof instagram_private_api_1.IgLoginInvalidUserError)) return [3 /*break*/, 5];
                    insertLine("[Error] Username doesn't exist");
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 5:
                    if (!(error_3 instanceof instagram_private_api_1.IgLoginTwoFactorRequiredError)) return [3 /*break*/, 7];
                    return [4 /*yield*/, resolveTwoFA(error_3)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 7:
                    if (!(error_3 instanceof instagram_private_api_1.IgCheckpointError)) return [3 /*break*/, 9];
                    return [4 /*yield*/, resolveChallenge()];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 9:
                    insertLine("[Error] " + error_3.message + '\n' + error_3.response);
                    console.error(error_3);
                    process.exit(1);
                    _a.label = 10;
                case 10: return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function saveAndPrintComments(lastCommentTs, system) {
    if (system === void 0) { system = false; }
    return __awaiter(this, void 0, void 0, function () {
        var comments, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, ig.live.getComment({ broadcastId: broadcastId, lastCommentTs: lastCommentTs })];
                case 1:
                    comments = (_a.sent())[system ? "system_comments" : "comments"];
                    if (comments.length > 0) {
                        comments.forEach(function (comment) {
                            if (!system) {
                                globalComments.push(comment);
                            }
                            var header = system ?
                                "[System]" :
                                "[Comment][ID: ".concat(globalComments.length - 1, "]");
                            var body = system ?
                                comment.text :
                                "".concat(comment.user.username, ": ").concat(comment.text);
                            insertLine("".concat(header, " ").concat(body));
                        });
                        return [2 /*return*/, comments[comments.length - 1].created_at];
                    }
                    else {
                        return [2 /*return*/, lastCommentTs];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    insertLine("[Error] " + error_4.message);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateViewerCount() {
    return __awaiter(this, void 0, void 0, function () {
        var viewer_count, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, ig.live.heartbeatAndGetViewerCount(broadcastId)];
                case 1:
                    viewer_count = (_a.sent()).viewer_count;
                    viewerCount = viewer_count;
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    insertLine("[Error] ".concat(error_5.message, "\n").concat(error_5.response));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function command(cmd, argv) {
    if (broadcastId !== "") {
        if (commandTable[cmd] !== undefined) {
            try {
                commandTable[cmd](argv);
            }
            catch (error) {
                insertLine("[Error] ".concat(error.message, "\n").concat(error.response));
            }
        }
        else {
            insertLine("[Error] Invalid command: " + cmd);
        }
    }
}
function insertLine(string) {
    // check how many lines does pinned comment + prompt + stdinBuffer takes
    // check width of terminal
    // clear line and write `string`
    var comment = globalComments[pinnedCommentIndex];
    var pinnedCommentLine = comment !== undefined ?
        "[Pin] ".concat(comment.user.username, ": ").concat(comment.text) :
        "";
    var timeElapse = new Date(streamTime * 1000).toISOString().slice(11, 19);
    var inputLine = "[".concat(timeElapse, "][").concat(viewerCount, "]").concat(PS1).concat(stdinBuffer);
    var columns = process.stdout.columns;
    var rows = Math.ceil(pinnedCommentLine.length / columns) +
        Math.ceil(inputLine.length / columns);
    // move up cursor
    if (rows > 1) {
        stdout.write("\u001B[".concat(rows - 1, "A"));
    }
    // clear lines
    for (var i = 0; i < rows; i++) {
        stdout.write("\u001B[2K\r\n");
    }
    if (rows > 0) {
        stdout.write("\u001B[".concat(rows, "A"));
    }
    // print
    if (string !== "") {
        stdout.write(string + '\n');
    }
    if (pinnedCommentLine !== "") {
        stdout.write(pinnedCommentLine + '\n');
    }
    stdout.write(inputLine);
}
function snooze(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
// TODO: support history
function pushToStdinBuffer(unicode) {
    switch (unicode) {
        // ctrl-c
        case "\u0003":
            return "end";
        // ctrl-d | Enter
        case "\u0004":
        case "\u000d":
            var buf = stdinBuffer;
            stdinBuffer = "";
            insertLine(buf);
            return buf;
        // delete
        case "\u007F":
            if (stdinBuffer != "") {
                stdout.write("\b \b");
                stdinBuffer = stdinBuffer.slice(0, -1);
            }
            return "";
        // all other characters
        default:
            stdinBuffer += unicode;
            stdout.write(unicode);
            return "";
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, broadcast_id, upload_url, _b, stream_key, stream_url, lastCommentTs, lastSystemCommentTs;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // setup stdin
                    stdin.setRawMode(true);
                    stdin.resume();
                    stdin.setEncoding("utf8");
                    // listen to keypress
                    stdin.on("data", function (c) {
                        var line = pushToStdinBuffer(String(c));
                        if (line != "") {
                            var _a = line.toString().match(/(?:[^\s"]+|"[^"]*")+/g), cmd = _a[0], argv = _a.slice(1);
                            try {
                                command(cmd, argv);
                            }
                            catch (error) {
                                insertLine("[Caught exception]");
                                insertLine(String(error.message));
                            }
                        }
                    });
                    insertLine("Logging in");
                    // basic login-procedure
                    return [4 /*yield*/, login()];
                case 1:
                    // basic login-procedure
                    _c.sent();
                    return [4 /*yield*/, ig.live.create({
                            // create a stream in 720x1280 (9:16)
                            previewWidth: config_json_1.live.width ? config_json_1.live.width : 720,
                            previewHeight: config_json_1.live.height ? config_json_1.live.height : 1280,
                            // this message is not necessary, because it doesn't show up in the notification
                            message: config_json_1.live.message ? config_json_1.live.message : ""
                        })];
                case 2:
                    _a = _c.sent(), broadcast_id = _a.broadcast_id, upload_url = _a.upload_url;
                    _b = instagram_private_api_1.LiveEntity.getUrlAndKey({ broadcast_id: broadcast_id, upload_url: upload_url }), stream_key = _b.stream_key, stream_url = _b.stream_url;
                    insertLine("Start your stream on ".concat(stream_url, ".\n") +
                        "Your key is: ".concat(stream_key));
                    broadcastId = broadcast_id;
                    /**
                     * make sure you are streaming to the url
                     * the next step will send a notification / start your stream for everyone to see
                     */
                    return [4 /*yield*/, ig.live.start(broadcast_id)];
                case 3:
                    /**
                     * make sure you are streaming to the url
                     * the next step will send a notification / start your stream for everyone to see
                     */
                    _c.sent();
                    setInterval(function () { streamTime += 1; insertLine(""); }, 1000);
                    lastCommentTs = 0;
                    lastSystemCommentTs = 0;
                    // enable the comments
                    return [4 /*yield*/, ig.live.unmuteComment(broadcast_id)];
                case 4:
                    // enable the comments
                    _c.sent();
                    // fetch comments
                    // and update viewer count
                    setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, saveAndPrintComments(lastCommentTs)];
                                case 1:
                                    lastCommentTs = _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, 2000);
                    setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, saveAndPrintComments(lastSystemCommentTs, true)];
                                case 1:
                                    lastSystemCommentTs =
                                        _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); }, 2000);
                    setInterval(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, updateViewerCount()];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    }); }); }, 2000);
                    _c.label = 5;
                case 5:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, snooze(1000)];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 7: return [2 /*return*/];
            }
        });
    });
}
main();
