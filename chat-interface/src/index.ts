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
            res.end('{"text": "Thanks for adding me!"}')
            return
        }

        case Hangouts.EventType.CARD: {
            let e = body as Hangouts.CardEvent

            // for consistency, pretend we got this command from Lex
            let eventID = e.action.parameters.filter(p => p.key === 'eventID')[0].value
            let lRes: Lex.Output = {
                dialogState: 'ReadyForFulfillment',
                intentName: e.action.actionMethodName,
                message: null,
                slots: {
                    eventID: eventID
                }
            }

            let rs = await coreRequest(lRes, e)
            res.end(rs)
            return
        }

        case Hangouts.EventType.MESSAGE: {
            let e = body as Hangouts.MessageEvent

            // eventually these messages will be triggered by the bot,
            // but for now, let's have a way for users to prompt them.
            if (e.message.text.includes('zenoss')) {
                res.end(JSON.stringify(example))
                return
            }

            let lRes = await lexBot.postText(e.message.text, e.message.sender.displayName)

            if (lRes.dialogState === 'ReadyForFulfillment') {
                let rs = await coreRequest(lRes, e)
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

async function coreRequest(l: Lex.Output, e: Hangouts.Event): Promise<string> {
    const rq = buildCoreRequest(l, e)
    const rs = await fetch(rq)

    return handleCoreResponse(rs)
}

function buildCoreRequest(l: Lex.Output, e: Hangouts.Event): Fetch.Request {
    const url = `${BOT_CORE_URL}/${l.intentName}`
    const body = {
        userEmail: e.user.email,
        channel: e.space.displayName,
        lexOutput: l
    }

    return new Fetch.Request(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })
}

async function handleCoreResponse(rs: Fetch.Response): Promise<string> {
    let r: CoreResponse = await rs.json()
    switch (r.type) {
        case 'link_message':
            let link = (r as LinkMessage).link
            return JSON.stringify({
                header: {
                    title: link.title
                },
                cards: [{
                    sections: [{
                        widgets: [{
                            keyValue: {
                                content: link.link_text,
                                bottomLabel: link.summary,
                                onClick: {
                                    openLink: {
                                        url: link.link_target
                                    }
                                }
                            }
                        }]
                    }]
                }]
            })
        default:
            let text = (r as PlainText).text
            return JSON.stringify({ text })
    }
}

type CoreResponse = PlainText | LinkMessage

interface PlainText {
    type: string, // "plain_text"
    text: string
}

interface LinkMessage {
    type: string, // "link_message"
    link: {
        title: string,
        link_text: string,
        link_target: string,
        summary: string
    }
}