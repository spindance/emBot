import * as HTTP from 'http'
import { json } from 'micro'
import fetch, * as Fetch from 'node-fetch'
import * as Env from 'require-env'

import * as Hangouts from './hangouts'
import * as Lex from './lex'
const example = require('./hangouts/cardExample')

const BOT_CORE_URL = Env.require('CORE_URL')
const SECRET_TOKEN = Env.require('HANGOUTS_SECRET_TOKEN')
const LEX_BOT_VERSION = Env.require('LEX_BOT_VERSION')

const lexBot = new Lex.LexBot('emBot', LEX_BOT_VERSION)

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    const body = await json(req) as Hangouts.Event

    // validate request is coming from Hangouts Chat
    if (body.token !== SECRET_TOKEN) {
        res.writeHead(403)
        res.end('unauthorized')
        return
    }

    switch (body.type) {
        case Hangouts.EventType.ADDED: {
            res.end('{"text": Thanks for adding me!"}')
            return
        }

        case Hangouts.EventType.CARD: {
            let b = body as Hangouts.CardEvent

            // for consistency, pretend we got this command from Lex
            let eventID = b.action.parameters.filter(p => p.key === 'eventID')[0].value
            let lRes: Lex.Output = {
                dialogState: 'ReadyForFulfillment',
                intentName: b.action.actionMethodName,
                message: null,
                slots: {
                    eventID: eventID
                }
            }

            let rs = await coreRequest(lRes)
            res.end(rs)
            return
        }

        case Hangouts.EventType.MESSAGE: {
            let b = body as Hangouts.MessageEvent

            // eventually these messages will be triggered by the bot,
            // but for now, let's have a way for users to prompt them.
            if (b.message.text.includes('zenoss')) {
                res.end(JSON.stringify(example))
                return
            }

            let lRes = await lexBot.postText(b.message.text, b.message.sender.displayName)

            if (lRes.dialogState === 'ReadyForFulfillment') {
                let rs = await coreRequest(lRes)
                res.end(rs)
                return
            }

            // else
            res.end(JSON.stringify({ text: lRes.message }))
            return
        }

        default: {
            res.end('bye')
        }
    }
}

async function coreRequest(l: Lex.Output): Promise<string> {
    const rq = buildCoreRequest(l)
    const rs = await fetch(rq)

    return handleCoreResponse(rs)
}

function buildCoreRequest(l: Lex.Output): Fetch.Request {
    const url = `${BOT_CORE_URL}/${l.intentName}`

    return new Fetch.Request(url, {
        method: 'POST',
        body: JSON.stringify(l),
        headers: { 'Content-Type': 'application/json' }
    })
}

async function handleCoreResponse(rs: Fetch.Response): Promise<string> {
    return rs.text()
        .then(t => JSON.stringify({ text: t }))
}