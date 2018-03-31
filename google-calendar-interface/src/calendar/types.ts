export interface CalendarList {
    items: Array<Calendar>
}

export interface Calendar {
    id: string,
    summary: string
}

export interface EventList {
    summary: string,
    items: Array<Event>
}

export interface Event {
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