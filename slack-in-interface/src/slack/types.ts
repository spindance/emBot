export interface WebUserListResponse {
    ok: boolean,
    user: {
        name: string,
        profile: {
            email: string
        }
    }
}

export type Event = InteractiveMessage | URLVerification | EventCallback

export interface InteractiveMessage {
    type: string, // "interactive_message"
    token: string,
    actions: Array<Action>,
    callback_id: string,
    team: Team,
    channel: Channel,
    user: User,
    response_url: string
}

export interface URLVerification {
    type: string, // "url_verification"
    token: string,
    challenge: string
}

export interface EventCallback {
    type: string, // "event_callback"
    token: string,
    team_id: string,
    event: {
        type: string, // "app_mention" or "message"
        subtype?: string,
        user: string, // like "U061F7AUR"
        text: string,
        channel: string // like "C0LAN2Q65"
    }
}

interface Action {
    name: string,
    value: string,
    type: string // "button"
}

interface Team {
    id: string,
    domain: string
}

interface Channel {
    id: string,
    name: string
}

interface User {
    id: string,
    name: string
}
