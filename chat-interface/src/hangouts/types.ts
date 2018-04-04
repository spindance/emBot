// reference: https://developers.google.com/hangouts/chat/reference/message-formats/events

export type Event = AddedEvent | MessageEvent | CardEvent | RemovedEvent

export interface AddedEvent {
    type: EventType,
    token: string,
    event_time: string, // iso datetime
    message: Message,
    space: Space,
    user: User
}

export interface MessageEvent {
    type: EventType,
    token: string,
    event_time: string, // iso datetime
    message: Message,
    space: Space,
    user: User,
    thread: MessageThread
}

export interface CardEvent {
    type: EventType,
    token: string,
    event_time: string, // iso datetime
    message: Message,
    space: Space,
    user: User,
    action: Action
}

export interface RemovedEvent {
    type: EventType,
    token: string,
    event_time: string, // iso datetime
    space: Space,
    user: User
}

export interface Message {
    name: string, // like "spaces/<space name>/messages/<letters>"
    sender: User,
    createTime: string,
    text: string,
    thread: MessageThread
}

export interface Space {
    name: string, // like "spaces/<letters>"
    displayName: string,
    type: string // "ROOM" (or possibly something to indicate a DM?)
}

export interface User {
    name: string, // like "users/<numbers>"
    displayName: string,
    avatarUrl: string,
    email: string
}

export interface Action {
    actionMethodName: string,
    parameters: Array<ActionParameter>
}

export interface MessageThread {
    name: string // like "space/<space name>/threads/<letters>"
}

export interface ActionParameter {
    key: string,
    value: string
}

export enum EventType {
    ADDED = "ADDED_TO_SPACE",
    MESSAGE = "MESSAGE",
    CARD = "CARD_CLICKED",
    REMOVED = "REMOVED_FROM_SPACE"
}