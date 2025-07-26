type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = Extract<
  T,
  Record<K, V>
>;
type MapDiscriminatedUnion<T extends Record<K, string>, K extends keyof T> = {
  [V in T[K]]: DiscriminateUnion<T, K, V>;
};

export type GameState = {
  words: string[][];
  currentState: string[];
  started: number;
  endsAt: number;
  endsIn: number;
  roundNumber: number;
  history: string[][];
};

export type Role = "dictator" | "scribe";

export type Message =
  | { type: "connect"; role: Role }
  | { type: "role_taken" }
  | { type: "disconnect"; role: Role }
  | { type: "start_game"; duration: number }
  | { type: "game_start"; startTime: number }
  | { type: "game_end_in"; in: number }
  | { type: "game_state"; inPlay: false; lastRound?: GameState }
  | {
      type: "game_state";
      inPlay: true;
      currentState: GameState;
    }
  | { type: "set_round"; value: number }
  | { type: "words"; value: string[][] }
  | { type: "current_state"; value: string[] };

export type MessageMap = MapDiscriminatedUnion<Message, "type">;
