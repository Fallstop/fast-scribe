type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = Extract<
  T,
  Record<K, V>
>;
type MapDiscriminatedUnion<T extends Record<K, string>, K extends keyof T> = {
  [V in T[K]]: DiscriminateUnion<T, K, V>;
};

export type GameState = {
  words: string[][];
  started: number;
  endsAt: number;
  endsIn: number;
  sentenceNumber: number;
  currentState: string[][];
  stats: {
    rawWpm: number;
    adjustedWpm: number;
    finalAccuracy: number;
  }[];
};

export type Role = "dictator" | "scribe";

export type Message =
  | { type: "connect"; role: Role }
  | { type: "role_taken" }
  | { type: "disconnect"; role: Role }
  | { type: "start_game"; duration: number }
  | { type: "game_start"; endsAt: number }
  | { type: "game_end_in"; in: number }
  | { type: "game_state"; inPlay: false; lastRound?: GameState }
  | {
      type: "game_state";
      inPlay: true;
      currentState: GameState;
    }
  | { type: "next_sentence"; raw: number; wpm: number; finalAccuracy: number }
  | { type: "words"; value: string[][] }
  | { type: "current_state"; value: string[]; sentenceNumber: number }
  | { type: "hello" };

export type MessageMap = MapDiscriminatedUnion<Message, "type">;
export type MessageHandlers = {
  [t in keyof MessageMap]?: (msg: MessageMap[t]) => void;
};
