import Router = require('fs-router')
import * as HTTP from 'http'
import { send } from 'micro'

let intents = Router(__dirname + '/intents')

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    let intentMatch = intents(req)

    if (intentMatch) {
        return await intentMatch(req, res)
    }

    // else
    send(res, 404, { error: 'Not found' })
}
