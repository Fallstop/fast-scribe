export interface GameState {
    gameSentences: string[][];
    roundNumber: number;
    currentInput: string[][];
}

export let gameState = $state<GameState>({
    gameSentences: [],
    roundNumber: 0,
    currentInput: [],
});
