import { RTMClient, WebClient } from '@slack/client'
import * as Env from 'require-env'

import * as Slack from './slack'

const token = Env.require('SLACK_API_TOKEN')
const rtm = new RTMClient(token)
const web = new WebClient(token)

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

    rtm.on('message', (event: Slack.MessageEvent) => {
        if (messageIsForBot(event.text, Bot)) {
            rtm.sendTyping(event.channel)

            let user = Users.find(u => u.id === event.user)
            setTimeout(() => {
                if (user === undefined) {
                    return rtm.sendMessage('Hello. Who are you?', event.channel)
                }
                rtm.sendMessage(`Hello, ${user.name}`, event.channel)
            }, 3000)
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