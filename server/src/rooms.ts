import { Message, MessageMap } from "common";
import { randomUUID } from "crypto";

type MessageHandlers = {
  [t in keyof MessageMap]?: (msg: MessageMap[t]) => void;
};

export const makeRoomManager = () => {
  const rooms = new Map<string, string[]>();
  const connections: Map<string, MessageHandlers> = new Map();

  const send = (roomCode: string, event: Message) => {
    const connectionIds = rooms.get(roomCode);
    if (!connectionIds) {
      return;
    }

    for (const connectionId of connectionIds) {
      const connection = connections.get(connectionId);
      if (!connection) {
        return;
      }

      const method = connection[event.type];
      if (method) {
        // @ts-ignore
        method(event);
      }
    }
  };

  return {
    register(roomCode: string) {
      const id = randomUUID();
      const handlers: MessageHandlers = {};
      const room = rooms.get(roomCode) ?? [];
      rooms.set(roomCode, room);
      room.push(id);
      connections.set(id, handlers);

      const on = <T extends keyof MessageMap>(
        message: T,
        handler: MessageHandlers[T],
      ) => {
        handlers[message] = handler;
      };

      const remove = () => {
        connections.delete(id);
        const room = rooms.get(roomCode);
        if (!room) {
          return;
        }

        rooms.set(
          roomCode,
          room.filter((x) => x != id),
        );

        if (rooms.get(roomCode)?.length ?? 1 < 1) {
          rooms.delete(roomCode);
        }
      };

      const broardcast = (event: Message) => {
        send(roomCode, event);
      };

      return {
        on,
        remove,
        broardcast,
      };
    },
    send,
  };
};
