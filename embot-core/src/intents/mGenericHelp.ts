import * as HTTP from 'http'
import { json, send } from 'micro'

interface expectedInput {
    lexOutput: {
        slots: {
            topic: string
        }
    }
}
module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    let body = await json(req) as expectedInput

    let text: string
    switch (body.lexOutput.slots.topic) {
        case 'Jira':
        case 'IT':
            text = 'I can create Jira tasks for IT support if you say ```create IT ticket``` and then describe the task.'
            break
        case 'Calendar':
            text = 'If you ask eg. ```is anyone in Missile Command?``` I can tell you if the room is available.'
            break
        default:
            text = 'You triggered the GenericHelp Intent!'
            break
    }
    send(res, 200, { type: 'plain_text', text })
}
