import { PUBLIC_API_URL } from "$env/static/public";
import type { Message, MessageHandlers } from "common";

type ExtractPromise<T> = T extends Promise<infer U> ? U : T;
export type WsClient = ExtractPromise<ReturnType<typeof createClient>>;

export const createGame = async () => {
  const res = await fetch(`ws://${PUBLIC_API_URL}/create-room`, {
    method: "POST",
  });

  return ((await res.json()) as { roomCode: string }).roomCode;
};

export const createClient = async (gameCode: string) => {
  const socket = new WebSocket(`ws://${PUBLIC_API_URL}/ws/${gameCode}`);
  const handlers: MessageHandlers = {};

  await new Promise((res) =>
    socket.addEventListener("open", () => {
      res(undefined);
    }),
  );

  const send = (message: Message) => {
    socket.send(JSON.stringify(message));
  };

  socket.addEventListener("message", (msg) => {
    if (typeof msg.data === "string") {
      let json = JSON.parse(msg.data) as Message;

      // @ts-ignore
      handlers[json.type]?.(json);
    }
  });

  return {
    connect(role: "scribe" | "dictator") {
      send({ type: "connect", role });
    },
    start(duration: number) {
      send({ type: "start_game", duration });
    },
    on<T extends keyof MessageHandlers>(
      message: T,
      handler: MessageHandlers[T],
    ) {
      handlers[message] = handler;
    },
  };
};
