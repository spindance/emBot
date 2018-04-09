import * as HTTP from 'http'
import { json, send } from 'micro'
import * as Env from 'require-env'
import { WebClient } from '@slack/client'

const API_TOKEN = Env.require('SLACK_API_TOKEN')
const slackWeb = new WebClient(API_TOKEN)

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    let body = await json(req) as ExpectedInput
    let slackOptions

    switch (body.type) {
        case 'plain_text':
            slackOptions = {
                channel: body.channel,
                text: (body as PlainText).text
            }
            break
        case 'link_message':
            let link = (body as LinkMessage).link
            slackOptions = {
                channel: body.channel,
                text: link.title,
                attachments: [{
                    title: link.link_text,
                    title_link: link.link_target,
                    text: link.summary,
                    color: "#7CD197"
                }]
            }
            break
    }

    slackWeb.chat.postMessage(slackOptions).then(rs => {
        if (rs.ok) {
            res.end('ok')
            return
        }
        send(res, 500, rs.error)
    })
}

type ExpectedInput = PlainText | LinkMessage | Interactive

interface PlainText {
    type: string, // "plain_text"
    channel: string,
    text: string
}

interface LinkMessage {
    type: string, // "link_message"
    channel: string,
    link: {
        title: string,
        link_text: string,
        link_target: string,
        summary: string
    }
}

interface Interactive {
    type: string, // "interactive"
    channel: string
    // TBD
}