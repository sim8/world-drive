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
    type: 'ECHO'
    data: {
        message: string
    }
}

export type ClientMessage = {
    type: 'SET_NAME'
    userId: string
    data: {
        name: string
    }
}
