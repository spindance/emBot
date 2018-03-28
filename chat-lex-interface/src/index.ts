import * as AWS from 'aws-sdk'
import * as Crypto from 'crypto'
import * as HTTP from 'http'
import { json } from 'micro'

import * as Hangouts from './hangouts'
const example = require('./hangouts/cardExample')

// let botCoreUrl = process.env.CORE_URL
const botVersion = process.env.BOT_VERSION || 'latest'
const secretToken = process.env.HANGOUTS_SECRET_TOKEN

const lexruntime = new AWS.LexRuntime({
    region: 'us-east-1'
})

interface lexInput {
    botAlias: string,
    botName: string,
    userId: string,
    inputText: string
}

interface lexOutput {
    dialogState: string,
    intentName: string | null,
    message: string | null,
    slots?: {
        [key: string]: string
    }
}

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    const body = await json(req) as Hangouts.Event

    // validate request is coming from Hangouts Chat
    if (body.token !== secretToken) {
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
            let lRes: lexOutput = {
                dialogState: 'ReadyForFulfillment',
                intentName: b.action.actionMethodName,
                message: null,
                slots: {
                    eventID: eventID
                }
            }
            // send request to botCore
            // format response
            res.end('{"text": "Ok."}')
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

            let params = buildLexParams(b)
            let lRes = await postLex(params)

            if (lRes.dialogState === 'ReadyForFulfillment') {
                // send request to botCore
                // format response
                res.end('{"text": "Ok."}')
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

function buildLexParams(h: Hangouts.MessageEvent): lexInput {
    /*
        AWS says userId should be something unique but not personally identifiable.
        Eventually, we may want to create and persist a user-specific UUID for this,
        but for now, just hash the user's name.
     */
    const hash = Crypto.createHash('sha256')
    hash.update(h.message.sender.displayName)

    return {
        botName: 'emBot',
        botAlias: botVersion,
        userId: hash.digest('hex'),
        inputText: h.message.text
    }
}

function postLex(i: lexInput): Promise<lexOutput> {
    return new Promise(function (resolve, reject) {
        lexruntime.postText(i, function (err: AWS.AWSError, data: AWS.LexRuntime.PostTextResponse) {
            return (err)
                ? reject(err)
                : resolve(data as lexOutput)
        })
    })
}
