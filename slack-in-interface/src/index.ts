import fetch, * as Fetch from 'node-fetch'
import * as HTTP from 'http'
import { json, send } from 'micro'
import * as Env from 'require-env'
import { WebClient } from '@slack/client'

import * as Lex from './lex'
import * as Slack from './slack'

const BOT_CORE_URL = Env.require('CORE_URL')
const SLACK_OUT_URL = Env.require('SLACK_OUT_URL')
const LEX_BOT_VERSION = Env.require('LEX_BOT_VERSION')
const SECRET_TOKEN = Env.require('SLACK_SECRET_TOKEN')
const API_TOKEN = Env.require('SLACK_API_TOKEN')

const lexBot = new Lex.LexBot('emBot', LEX_BOT_VERSION)
const slackWeb = new WebClient(API_TOKEN)

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    const body = await json(req) as Slack.Event

    // validate request is coming from Slack
    if (body.token !== SECRET_TOKEN) {
        send(res, 403, 'unauthorized')
        return
    }

    switch (body.type) {
        case 'url_verification':
            send(res, 200, { challenge: (body as Slack.URLVerification).challenge })
            break
        case 'interactive_message':
            // someone clicked a button
            send(res, 200)
            // more coming soon:
            // create a Lex.Output and send it to embot-core
            // send core response to slack-out-interface
            break
        case 'event_callback':
            // someone is talking to us
            send(res, 200)
            let msg = body as Slack.EventCallback
            let lRes = await lexBot.postText(msg.event.text, msg.event.user)

            if (lRes.dialogState === 'ReadyForFulfillment') {
                // find email based on userID
                let email = await lookupSlackEmail(msg.event.user)
                let rs = await coreRequest(lRes, email, '')

                await slackOutRequest(msg.event.channel, rs)
            } else {
                await slackOutRequest(msg.event.channel, lRes.message as string)
            }
        default:
            send(res, 200)
    }
}

async function lookupSlackEmail(userID: string): Promise<string> {
    return slackWeb.users.info({ user: userID })
        .then(data => {
            let user = (data as Slack.WebUserListResponse).user
            return user.profile.email
        })
}

async function coreRequest(l: Lex.Output, userEmail: string, channel: string): Promise<string> {
    const rq = buildCoreRequest(l, userEmail, channel)
    const rs = await fetch(rq)

    return handleCoreResponse(rs)
}

function buildCoreRequest(lexOutput: Lex.Output, userEmail: string, channel: string): Fetch.Request {
    const url = `${BOT_CORE_URL}/${lexOutput.intentName}`
    const body = { lexOutput, userEmail, channel }

    return new Fetch.Request(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })
}

async function handleCoreResponse(rs: Fetch.Response): Promise<string> {
    return rs.text()
}

async function slackOutRequest(channel: string, text: string): Promise<boolean> {
    const rq = buildSlackOutRequest(channel, text)
    const rs = await fetch(rq)

    return rs.ok
}

function buildSlackOutRequest(channel: string, text: string): Fetch.Request {
    const url = SLACK_OUT_URL
    const body = { type: 'plain_text', channel, text }

    return new Fetch.Request(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })
}