import * as HTTP from 'http'
import { json } from 'micro'
import fetch, * as Fetch from 'node-fetch'

const CALENDAR_URL = process.env.CALENDAR_INTERFACE_URL

// same as lexOutput in chat-lex-interface
interface ExpectedInput {
    slots: {
        room: string
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
    let rs = await calendarRequest(body as ExpectedInput)

    res.end(rs)
    return
}

async function calendarRequest(b: ExpectedInput): Promise<string> {
    const rq = buildCalendarRequest(b.slots)
    const rs = await fetch(rq)

    return handleCoreResponse(b.slots.room, rs)
}

function buildCalendarRequest(slots: { room: string }): Fetch.Request {
    return new Fetch.Request(`${CALENDAR_URL}/`, {
        method: 'POST',
        body: JSON.stringify(slots),
        headers: { 'Content-Type': 'application/json' }
    })
}

async function handleCoreResponse(room: string, rs: Fetch.Response): Promise<string> {
    const events = await rs.json() as Array<CalendarEvent>

    if (events.length === 0) {
        return `${room} is available all day.`
    }

    const firstStartTime = new Date(events[0].start.dateTime)
    if (firstStartTime.valueOf() > Date.now()) {
        // room is currently free
        const time = firstStartTime.toLocaleTimeString()
        return `${room} is available until ${time}`
    }

    // room is currently booked
    let nextFreeTime: Date = firstStartTime
    for (var e of events) {
        let startTime = new Date(e.start.dateTime)

        if (nextFreeTime === startTime) {
            nextFreeTime = new Date(e.end.dateTime)
        } else {
            break
        }
    }

    return `${room} is booked until ${nextFreeTime.toLocaleTimeString()}`
}
