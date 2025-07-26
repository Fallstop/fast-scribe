import { gameState } from "./state.svelte";
import { PUBLIC_API_URL } from "$env/static/public";

let gameId = $state("");

let wsClient = $derived(
  gameId != ""
    ? new WebSocket(`ws://${PUBLIC_API_URL}/ws/${gameId}`)
    : undefined,
);

// $effect(() => {
//     if (!wsClient) {
//         return;
//     }

//     wsClient.addEventListener("message", onMessage);
// })

export function getGameId() {
  return gameId;
}

function onMessage(ev: MessageEvent<any>) {}

function generateClientId() {
  return Math.random().toString(36).substring(2, 15);
}

export async function createGame(): Promise<string> {
  // post to the server
  let res = await fetch("http://" + PUBLIC_API_URL + "/create-room", {
    method: "POST",
  });
  const data = (await res.json()) as { roomCode: string };
  console.log(data);
  return data.roomCode;
}

export function nextRound() {
  // should be controlled by the server?
  gameState.roundNumber += 1;
}

export async function joinGame(_gameId: string) {
  gameId = _gameId;

  // Check if the game ID is valid
  if (!gameId || gameId.length < 5) {
    throw new Error("Invalid game ID");
  }

  // Create or get a client ID for the game
  let clientId =
    localStorage.getItem(`clientId-${gameId}`) || generateClientId();
  localStorage.setItem(`clientId-${gameId}`, clientId);

  // console.log(`Client ${clientId} joined game ${gameId}`);
}

export async function sendTypingUpdate(newText: string[]) {}

export async function getGameState() {}

export async function typingUpdate(newText: string[]) {
  gameState.currentInput[gameState.roundNumber] = newText;
}

// export async function getGameState() {
//     // Get latest game state

//     gameState.roundNumber = 0;
//     gameState.currentInput = [];
//     gameState.gameSentences = [
//         "This is a test sentence.".split(" "),
//         "Another sentence to type.".split(" "),
//         "Yet another sentence for testing.".split(" "),
//         "Final sentence to complete THE GAME.".split(" "),
//         "I lied.".split(" "),
//         "This is a longer sentence that should be typed out completely.".split(" "),
//         "Medium length sentence for the game.".split(" "),
//         "Quick brown fox jumps over the lazy dog.".split(" "),
//         "Sphinx of black quartz, judge my vow.".split(" "),
//         "Pack my box with five dozen liquor jugs.".split(" ")
//     ];
// }
