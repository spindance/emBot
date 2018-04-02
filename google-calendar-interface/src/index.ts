import { JWT as GoogleAuth } from 'google-auth-library'
import * as HTTP from 'http'
import { json } from 'micro'

import * as Calendar from './calendar'

const EIGHT_HOURS = 8 * 60 * 60 * 1000
const GCAL_ENDPOINT = 'https://www.googleapis.com/calendar/v3'
const CLIENT = new GoogleAuth({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n'),
    scopes: 'https://www.googleapis.com/auth/calendar.readonly'
})

interface expectedInput {
    room?: string
}

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    await CLIENT.authorize()
    const body: expectedInput = await json(req)

    const calendars = await requestCalendars(CLIENT)
    const eventLists = await Promise.all(
        calendars.items
            .filter(cal => {
                return body.room === undefined || body.room === cal.summary
            })
            .map(cal => {
                return requestEvents(CLIENT, cal)
            })
    )

    const events = eventLists.reduce((acc: Array<Calendar.Event>, el: Calendar.EventList) => {
        return acc.concat(el.items)
    }, [])

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(events))
}

async function requestCalendars(c: GoogleAuth): Promise<Calendar.CalendarList> {
    const url = `${GCAL_ENDPOINT}/users/me/calendarList`
    const params = {
        fields: 'items(id,summary)'
    }

    const r = await c.request({ url, params })
    return r.data as Calendar.CalendarList
}

async function requestEvents(cli: GoogleAuth, cal: Calendar.Calendar): Promise<Calendar.EventList> {
    const url = `${GCAL_ENDPOINT}/calendars/${cal.id}/events`
    const min = new Date()
    const max = new Date(min.valueOf() + EIGHT_HOURS)

    const params = {
        fields: 'items(creator/displayName,end/dateTime,location,start/dateTime,summary),summary',
        orderBy: 'startTime',
        singleEvents: true,
        timeMin: min.toISOString(),
        timeMax: max.toISOString()
    }

    const r = await cli.request({ url, params })
    return r.data as Calendar.EventList
}
