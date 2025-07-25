type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = Extract<
  T,
  Record<K, V>
>;
type MapDiscriminatedUnion<T extends Record<K, string>, K extends keyof T> = {
  [V in T[K]]: DiscriminateUnion<T, K, V>;
};

export type Message = { type: "connect" } | { type: "keydown"; value: string };
export type MessageMap = MapDiscriminatedUnion<Message, "type">;
