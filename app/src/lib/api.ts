import {io } from 'socket.io-client';

export enum MessageTypes {
    NEW_GAME = 'new_game',
    JOIN_GAME = 'join_game',
    START_GAME = 'start_game',
    INPUT_UPDATE = 'input_update',
}


export type Message = {
    type: MessageTypes.JOIN_GAME,
    clientId: string,
} | {
    type: MessageTypes.INPUT_UPDATE,
    clientId: string,
    input: string,
    cursorPosition: number,
}


export function createGame() {
    const socket = io();

    socket.emit(MessageTypes.NEW_GAME, { message: 'Creating a new game' });
}