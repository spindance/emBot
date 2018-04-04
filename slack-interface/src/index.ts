import fetch, * as Fetch from 'node-fetch'
import { RTMClient, WebClient } from '@slack/client'
import * as Env from 'require-env'

import * as Lex from './lex'
import * as Slack from './slack'

const BOT_CORE_URL = Env.require('CORE_URL')
const LEX_BOT_VERSION = Env.require('LEX_BOT_VERSION')
const TOKEN = Env.require('SLACK_API_TOKEN')

const lexBot = new Lex.LexBot('emBot', LEX_BOT_VERSION)
const rtm = new RTMClient(TOKEN)
const web = new WebClient(TOKEN)

main()
async function main() {
    let Users: Array<Slack.User> = await refreshLocalUsers()
    let Bot: Slack.Bot

    rtm.start({})

    rtm.on('connected', async () => {
        let botUserId = rtm.activeUserId
        let b = Users.find(u => u.id === botUserId)

        if (b === undefined) {
            throw 'Bot is undefined!'
        }
        Bot = b as Slack.Bot
    })
    rtm.on('reconnected', async () => {
        Users = await refreshLocalUsers()
    })
    rtm.on('team_join', async () => {
        Users = await refreshLocalUsers()
    })
    rtm.on('user_change', async () => {
        Users = await refreshLocalUsers()
    })

    rtm.on('message', async (event: Slack.MessageEvent) => {
        if (messageIsForBot(event.text, Bot)) {
            rtm.sendTyping(event.channel)

            let user = Users.find(u => u.id === event.user)

            if (user === undefined) { // this shouldn't happen
                return rtm.sendMessage('My mommy told me not to talk to strangers', event.channel)
            }

            let sanitized = event.text
                .replace(`<@${Bot.id}>`, '')
                .replace(Bot.name, '') /* don't send an empty string */ || 'hello'
            let lRes = await lexBot.postText(sanitized, user.name)

            if (lRes.dialogState === 'ReadyForFulfillment') {
                try {
                    let rs = await coreRequest(lRes)
                    return rtm.sendMessage(rs, event.channel)
                }
                catch (error) {
                    console.log(error)
                    return rtm.sendMessage('Sorry, I\'m having some networking trouble. Please try again later.', event.channel)
                }
            }
            if (lRes.message == undefined) { // this shouldn't happen either
                let garbage = JSON.stringify(lRes)
                return rtm.sendMessage(`Sorry, Lex send me this garbage: ${garbage}`, event.channel)
            }
            return rtm.sendMessage(lRes.message, event.channel)
        }
    })
}

function messageIsForBot(text: string, bot: Slack.Bot): boolean {
    let idRegex = new RegExp(bot.id)
    let nameRegex = new RegExp(bot.name)

    return idRegex.test(text) || nameRegex.test(text)
}

async function refreshLocalUsers(): Promise<Array<Slack.User>> {
    return web.users.list()
        .then(res => {
            if (res.error) {
                console.log(res.error)
                return []
            }
            let body = res as Slack.UsersListResponse
            return body.members
        })
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
}