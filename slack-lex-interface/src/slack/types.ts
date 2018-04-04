export type User = Human | Bot

export interface Human {
    id: string,
    name: string,
    profile: {
        real_name: string,
        display_name: string,
        email: string
    }
    is_bot: boolean // false, obvs
}

export interface Bot {
    id: string,
    name: string
    profile: {
        real_name: string,
        display_name: string,
        bot_id: string
    }
    is_bot: boolean // true, obvs
}

export interface UsersListResponse {
    ok: boolean,
    members: Array<User>
}

export interface MessageEvent {
    type: string, // "message"
    channel: string,
    user: string,
    text: string,
    ts: string
}
