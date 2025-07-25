export interface GameState {
    targetText: string[];
    currentInput: string[];
}

export let gameState = $state<GameState>({
    targetText: "This is a test sentence. Another sentence to type.".split(" "),
    currentInput: [],
});
