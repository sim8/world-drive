import { z } from 'zod';

export const MAX_NAME_LENGTH = 32;

export const nameSchema = z.string().trim()
    .min(1, 'Enter a name.')
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters.`);

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
} | {
    type: 'USER_UPDATED'
    data: { userState: UserState }
} | {
    type: 'ERROR'
    data: {
        code: 'INVALID_JSON' | 'INVALID_MESSAGE'
        message: string
        issues?: { path: string; message: string }[]
    }
}

export const clientMessageSchema = z.object({
    type: z.literal('SET_NAME'),
    data: z.object({
        name: nameSchema,
    }),
});

export type ClientMessage = z.infer<typeof clientMessageSchema>;
