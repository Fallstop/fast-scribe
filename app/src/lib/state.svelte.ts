import type { MessageMap } from "common";

export interface GameState {
  gameSentences: string[][];
  sentenceNumber: number;
  currentInput: string[][];
}

export let gameState = $state<GameState>({
  gameSentences: [],
  sentenceNumber: 0,
  currentInput: [],
});

export function updateGameState(newState: MessageMap["game_state"]) {
  let actualState = newState.inPlay
    ? newState.currentState
    : newState.lastRound;
  if (!actualState) {
    return;
  }

  gameState.gameSentences = actualState.words;
  gameState.sentenceNumber = actualState.sentenceNumber;
  gameState.currentInput = actualState.currentState;
}

export function typingUpdate(msg: MessageMap["current_state"]) {
  gameState.currentInput[msg.sentenceNumber] = msg.value;
}
