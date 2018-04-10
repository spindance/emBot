import * as HTTP from 'http'
import { json, send } from 'micro'
import fetch, * as Fetch from 'node-fetch'
import * as Env from 'require-env'

const CALENDAR_URL = Env.require('CALENDAR_INTERFACE_URL')

interface ExpectedInput {
    userEmail: string,
    channel: string,
    lexOutput: {
        slots: {
            room: string
        }
    }
}

// same as Event in google-calendar-interface
interface CalendarEvent {
    summary: string,
    location: string,
    creator: {
        displayName: string
    },
    start: {
        dateTime: string
    },
    end: {
        dateTime: string
    }
}

module.exports = async (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => {
    let body = await json(req)
    let text = await calendarRequest(body as ExpectedInput)

    send(res, 200, { type: 'plain_text', text })
}

async function calendarRequest(b: ExpectedInput): Promise<string> {
    const rq = buildCalendarRequest(b.lexOutput.slots)
    const rs = await fetch(rq)

    return handleCalendarResponse(b.lexOutput.slots.room, rs)
}

function buildCalendarRequest(slots: { room: string }): Fetch.Request {
    return new Fetch.Request(`${CALENDAR_URL}/`, {
        method: 'POST',
        body: JSON.stringify(slots),
        headers: { 'Content-Type': 'application/json' }
    })
}

async function handleCalendarResponse(room: string, rs: Fetch.Response): Promise<string> {
    const events = await rs.json() as Array<CalendarEvent>

    if (events.length === 0) {
        return `${room} is available for the rest of the day.`
    }

    const fe = events[0]
    const firstStartTime = new Date(fe.start.dateTime)

    if (firstStartTime.valueOf() > Date.now()) {
        // room is currently free
        const time = timeInZone(firstStartTime)
        return `${room} is available until ${time}.`
    }

    // room is currently booked
    let nextFreeTime: Date = firstStartTime
    for (var e of events) {
        let startTime = new Date(e.start.dateTime)

        if (nextFreeTime.valueOf() === startTime.valueOf()) {
            nextFreeTime = new Date(e.end.dateTime)
        } else {
            break
        }
    }

    return `${fe.creator.displayName} has booked ${room} for ${fe.summary}. It will be available at ${timeInZone(nextFreeTime)}.`
}

function timeInZone(d: Date): string {
    return d.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        timeZoneName: 'short'
    })
}
