import * as HTTP from 'http'
import { json, send } from 'micro'

const FORM_URL = `https://docs.google.com/forms/d/e/1FAIpQLScGAR0i1t-7x5Fu3gvYM3q7oRRv10uUTasYDFMcCdN6pZgjsw/viewform?usp=pp_url&entry.138056703=`

interface ExpectedInput {
    lexOutput: {
        slots: {
            person: string
        }
    }
}

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    let input = await json(req) as ExpectedInput
    let person = input.lexOutput.slots.person
        .replace(' ', '+')

    let text: string
    text = 'Awesomeness Nominator to the rescue!'

    send(res, 200, {
        type: 'link_message',
        link: {
            title: `Nominate ${input.lexOutput.slots.person} for Awesomeness`,
            link_text: `here`,
            link_target: `${FORM_URL}${person}`,
            summary: text
        }
    })
}
