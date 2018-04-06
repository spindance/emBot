import * as HTTP from 'http'
import { json } from 'micro'

interface expectedInput {
    lexOutput: {
        slots: {
            topic: string
        }
    }
}
module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    let body = await json(req) as expectedInput

    switch (body.lexOutput.slots.topic) {
        case 'Jira':
        case 'IT':
            res.end('I can create Jira tasks for IT support if you say *create IT ticket* and then describe the task.')
            return

        case 'Calendar':
            res.end('If you ask *is anyone in <conference room>*, I can tell you if a room is available.')
            return

        default:
            res.end('You triggered the GenericHelp Intent!')
    }
}
