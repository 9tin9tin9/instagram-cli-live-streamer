/* tslint:disable:no-console */
import {
    IgApiClient,
    LiveEntity,
    LiveCommentsResponseCommentsItem,
    IgLoginInvalidUserError,
    IgLoginTwoFactorRequiredError,
    IgLoginBadPasswordError,
    IgCheckpointError,
} from 'instagram-private-api';

import { account, live, } from "./config.json";

const stdout = process.stdout;
const stdin = process.stdin;
const PS1 = "> ";
let stdinBuffer = "";

const ig = new IgApiClient();
let broadcastId = "";
let streamTime = 0;  // seconds
let viewerCount = 0;
let globalComments: LiveCommentsResponseCommentsItem[] = [];
let pinnedCommentIndex = -1;

// TODO:
//     - implement pin()
const commandTable = {
    comment: async (strings: string[]) => {
        let comment = ""
        strings.forEach(s => {
            if (s[0] === '\"'){
                s = s.slice(1)
            }
            if (s[s.length-1] === '\"'){
                s = s.slice(0, -1)
            }
            comment += s + ' '
        });
        comment = comment.trim();

        if (comment === "") {
            insertLine("[Error] This comment did not contain any text");
        } else {
            ig.live.comment(broadcastId, comment);
        }
    },

    pin: async (argv: string[]) => {
        let id = Number(argv[0]);
        const comment = globalComments[id];
        if (comment !== undefined){
            if (pinnedCommentIndex === id){
                pinnedCommentIndex = -1;
                await ig.live.unpinComment(broadcastId, comment.pk);
                insertLine("[Unpinned comment]");
            }else{
                pinnedCommentIndex = id;
                await ig.live.pinComment(broadcastId, comment.pk);
                insertLine("[Pinned comment]");
            }
        }else{
            insertLine("[Error] Invalid comment id");
        }
    },

    viewerList: async (_argv: string[]) => {
        const { users } = await ig.live.getViewerList(broadcastId);
        insertLine("[Viewer list start]");
        users.forEach(user => insertLine(user.username));
        insertLine("[Viewer list end]");
    },

    end: async (_argv: string[]) => {
        await ig.live.endBroadcast(broadcastId);
        insertLine("[Live ended]");
        insertLine("[Exit]");
        process.exit(0);
    },

    help: (_argv: string[]) => {
        insertLine("[Available commands start]");
        Object.keys(commandTable).forEach(key => insertLine(key));
        insertLine("[Available commands end]");
    }
}

async function resolveTwoFA(err: IgLoginTwoFactorRequiredError){
    insertLine("[Info] TwoFA enabled");

    const {username, totp_two_factor_on, two_factor_identifier} =
        err.response.body.two_factor_info;
    const verificationMethod = totp_two_factor_on ? '0' : '1'; // default to 1 for SMS

    insertLine("Enter code received via " + 
               `${verificationMethod === '1' ? 'SMS' : 'TOTP'}`);
    while(!(stdinBuffer.length === 6 &&
          /^[0-9\b]+$/.test(stdinBuffer))) {
        await snooze(500);
    }
    try {
        const code = stdinBuffer;
        stdinBuffer = "";
        insertLine("Verifying: " + code);
        await ig.account.twoFactorLogin({
            username,
            verificationCode: code,
            twoFactorIdentifier: two_factor_identifier,
            verificationMethod, // '1' = SMS (default), '0' = TOTP (google auth for example)
            trustThisDevice: '1', // Can be omitted as '1' is used by default
        });

    } catch (error) {
        insertLine("[Error] " + error.message + '\n' + error.response);
        console.error(error);
        process.exit(1);
    }
}

async function resolveChallenge(){
    await ig.challenge.auto(true);
    await ig.challenge.auto();

    insertLine("Enter the 6 digit code sent to you");
    while(!(stdinBuffer.length === 6 &&
          /^[0-9\b]+$/.test(stdinBuffer))) {
        await snooze(500);
    }

    try {
        const code = stdinBuffer;
        stdinBuffer = "";
        insertLine("Verifying: " + code);
        await ig.challenge.sendSecurityCode(code);

    } catch (error) {
        insertLine("[Error] " + error.message + '\n' + error.response);
        console.error(error);
        process.exit(1);
    }
}

async function login() {
    ig.state.generateDevice(account.username);

    try {
        await ig.account.login(account.username, account.password);
    } catch (error) {
        if (error instanceof IgLoginBadPasswordError) {
            insertLine("[Error] Incorrect Username or Password");
            process.exit(1);

        }else if (error instanceof IgLoginInvalidUserError) {
            insertLine("[Error] Username doesn't exist");
            process.exit(1);

        }else if (error instanceof IgLoginTwoFactorRequiredError) {
            await resolveTwoFA(error);

        }else if (error instanceof IgCheckpointError) {
            await resolveChallenge();

        }else {
            insertLine("[Error] " + error.message + '\n' + error.response);
            console.error(error);
            process.exit(1);
        }
    }
}

async function saveAndPrintComments(
    lastCommentTs: number,
    system: boolean = false)
{
    try{
        const comments =
            (await ig.live.getComment({ broadcastId, lastCommentTs }))[
            system ? "system_comments" : "comments"];

        if (comments.length > 0) {
            comments.forEach(comment => {
                if (!system) {
                    globalComments.push(comment);
                }
                const header = system ?
                    "[System]" :
                    `[Comment][ID: ${globalComments.length - 1}]`;
                const body = system ?
                    comment.text :
                    `${comment.user.username}: ${comment.text}`;
                insertLine(`${header} ${body}`);
            });
            return comments[comments.length - 1].created_at;

        } else {
            return lastCommentTs;
        }
    } catch (error) {
        insertLine("[Error] " + error.message);
    }
}

async function updateViewerCount(){
    try {
        const { viewer_count } =
            await ig.live.heartbeatAndGetViewerCount(broadcastId);
        viewerCount = viewer_count;
    } catch (error) {
        insertLine(`[Error] ${error.message}\n${error.response}`);
    }
}

function command(cmd: string, argv: string[]) {
    if (broadcastId !== ""){
        if (commandTable[cmd] !== undefined){
            try {
                commandTable[cmd](argv);
            } catch (error) {
                insertLine(`[Error] ${error.message}\n${error.response}`);
            }
        }else{
            insertLine("[Error] Invalid command: " + cmd);
        }
    }
}

function insertLine(string: string) {
    // check how many lines does pinned comment + prompt + stdinBuffer takes
    // check width of terminal
    // clear line and write `string`

    const comment = globalComments[pinnedCommentIndex];
    const pinnedCommentLine = comment !== undefined ?
        `[Pin] ${comment.user.username}: ${comment.text}` :
        "";
    const timeElapse = new Date(streamTime * 1000).toISOString().slice(11, 19);
    const inputLine = `[${timeElapse}][${viewerCount}]${PS1}${stdinBuffer}`;

    const columns = process.stdout.columns;
    const rows = Math.ceil(pinnedCommentLine.length / columns) +
        Math.ceil(inputLine.length / columns);

    // move up cursor
    if (rows > 1){ 
        stdout.write(`\x1b[${rows-1}A`);
    }
    // clear lines
    for (let i = 0; i < rows; i++){
        stdout.write(`\x1b[2K\r\n`);
    }
    if (rows > 0){
        stdout.write(`\x1b[${rows}A`);
    }

    // print
    if (string !== ""){
        stdout.write(string + '\n');
    }
    if (pinnedCommentLine !== ""){
        stdout.write(pinnedCommentLine + '\n');
    }
    stdout.write(inputLine);
}

function snooze(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO: support history
function pushToStdinBuffer(unicode: string) {
    switch (unicode) {
        // ctrl-c
        case "\u0003":
            return "end";

        // ctrl-d | Enter
        case "\u0004":
        case "\u000d":
            const buf = stdinBuffer;
            stdinBuffer = "";
            insertLine(buf);
            return buf;

        // delete
        case "\u007F":
            if (stdinBuffer != ""){
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

async function main() {
    // setup stdin
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    // listen to keypress
    stdin.on("data", c => {
        const line = pushToStdinBuffer(String(c));

        if (line != ""){
            const [cmd, ...argv] =
                line.toString().match(/(?:[^\s"]+|"[^"]*")+/g) 
            try {
                command(cmd, argv);
            } catch (error) {
                insertLine("[Caught exception]");
                insertLine(String(error.message));
            }
        }
    });
    insertLine("Logging in");

    // basic login-procedure
    await login();

    const { broadcast_id, upload_url } = await ig.live.create({
        // create a stream in 720x1280 (9:16)
        previewWidth: live.width ? live.width : 720,
        previewHeight: live.height ? live.height : 1280,
        // this message is not necessary, because it doesn't show up in the notification
        message: live.message ? live.message : "",
    });

    // (optional) get the key and url for programs such as OBS
    const { stream_key, stream_url } =
        LiveEntity.getUrlAndKey({ broadcast_id, upload_url });
    insertLine(`Start your stream on ${stream_url}.\n` +
               `Your key is: ${stream_key}`);
    broadcastId = broadcast_id;

    /**
     * make sure you are streaming to the url
     * the next step will send a notification / start your stream for everyone to see
     */
    await ig.live.start(broadcast_id);
    setInterval(() => { streamTime += 1; insertLine(""); }, 1000);

    // initial comment-timestamp = 0, get all comments
    let lastCommentTs = 0;
    let lastSystemCommentTs = 0;
    // enable the comments
    await ig.live.unmuteComment(broadcast_id);

    // fetch comments
    // and update viewer count
    setInterval(async () => {
        lastCommentTs = await saveAndPrintComments(lastCommentTs);
    }, 2000);
    setInterval(async () => {
        lastSystemCommentTs =
            await saveAndPrintComments(lastSystemCommentTs, true);
    }, 2000);
    setInterval(async () => await updateViewerCount(), 2000);

    while(true){
        await snooze(1000);
    }
}

main();
