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

    return Math.random().toString(36).substring(2, 8);
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

    gameState.roundNumber = 0;
    gameState.currentInput = [];
    gameState.gameSentences = [
        "This is a test sentence.".split(" "),
        "Another sentence to type.".split(" "),
        "Yet another sentence for testing.".split(" "),
        "Final sentence to complete the game.".split(" "),
        "I lied.".split(" "),
        "This is a longer sentence that should be typed out completely.".split(" "),
        "Medium length sentence for the game.".split(" "),
        "Quick brown fox jumps over the lazy dog.".split(" "),
        "Sphinx of black quartz, judge my vow.".split(" "),
        "Pack my box with five dozen liquor jugs.".split(" ")
    ];
}


export async function typingUpdate(newText: string[]) {
    gameState.currentInput = newText;
}


export async function getGameState() {
    // Get latest game state

    gameState.roundNumber = 0;
    gameState.currentInput = [];
    gameState.gameSentences = [
        "This is a test sentence.".split(" "),
        "Another sentence to type.".split(" "),
        "Yet another sentence for testing.".split(" "),
        "Final sentence to complete the game.".split(" "),
        "I lied.".split(" "),
        "This is a longer sentence that should be typed out completely.".split(" "),
        "Medium length sentence for the game.".split(" "),
        "Quick brown fox jumps over the lazy dog.".split(" "),
        "Sphinx of black quartz, judge my vow.".split(" "),
        "Pack my box with five dozen liquor jugs.".split(" ")
    ];
}