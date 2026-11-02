export type UserState = {
    name?: string
}

export type ServerMessage = {
    type: 'CONNECTION_SUCCESSFUL'
    data: {
        userId: string
        userState: UserState
    }
} | {
    type: 'PLAYERS_UPDATED'
    data: {
        players: UserState[]
    }
}

export type ClientMessage = {
    type: 'SET_NAME'
    data: {
        name: string
    }
}
