import { gameState } from "./state.svelte";
import { PUBLIC_API_URL } from "$env/static/public";
import { type Message } from "common";

let gameId = $state("");

let wsClient = $derived(
  gameId != ""
    ? new WebSocket(`ws://${PUBLIC_API_URL}/ws/${gameId}`)
    : undefined
);

// $effect(() => {
//     if (!wsClient) {
//         return;
//     }

//     wsClient.addEventListener("message", onMessage);
// })

function send(msg: Message) {
  wsClient?.send(JSON.stringify(msg));
  console.log("sent: " + JSON.stringify(msg))
}

export function getGameId() {
  return gameId;
}

function onMessage(ev: MessageEvent<any>) {
  console.log("recieved: "+ ev.data);
}

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
  send({
    type: "next_round",
  });
}

export async function joinGame(_gameId: string, scribe: boolean) {
  gameId = _gameId;

  // Check if the game ID is valid
  if (!gameId || gameId.length < 5) {
    throw new Error("Invalid game ID");
  }

  // Create or get a client ID for the game
  let clientId =
    localStorage.getItem(`clientId-${gameId}`) || generateClientId();
  localStorage.setItem(`clientId-${gameId}`, clientId);

  if (wsClient) {
    wsClient.addEventListener("message", onMessage);
    wsClient.addEventListener("open", () => {
      send({
        type: "connect",
        role: scribe ? "scribe" : "dictator",
      });
      if (scribe) {
          send({
            type: "start_game",
            duration: 60
          })
      }
    });

  } else {
    console.log("SOMETHING WENT TERRIBLY WRONG");
  }
}

export async function sendTypingUpdate(newText: string[]) {
  send({
    type: "current_state",
    // value: gameState.currentInput[gameState.currentInput.length-1]
    value: newText,
  });
}

export async function setGameState() {
  // gameState =
}

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
