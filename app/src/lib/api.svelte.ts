import { gameState } from "./state.svelte";


let clientId = $state('');
let gameId = $state('');


let wsClient;

export function getGameId() {
    return gameId;
}


function generateClientId() {
    return Math.random().toString(36).substring(2, 15);
}


export function createGame(): string {

    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}


export async function joinGame(_gameId: string) {
    gameId = _gameId;

    // Check if the game ID is valid
    if (!gameId || gameId.length < 5) {
        throw new Error("Invalid game ID");
    }

    // Create or get a client ID for the game
    clientId = localStorage.getItem(`clientId-${gameId}`) || generateClientId();
    localStorage.setItem(`clientId-${gameId}`, clientId);

    // Join game
    console.log(`Client ${clientId} joined game ${gameId}`);
}


export async function typingUpdate(newText: string[]) {
    gameState.currentInput = newText;
}

