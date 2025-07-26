import { Message, MessageMap } from "common";
import { randomUUID } from "crypto";
import { UnsupportedPathError } from "hono/router";

type MessageHandlers = {
  [t in keyof MessageMap]?: (msg: MessageMap[t]) => void;
};

export const makeRoomManager = () => {
  const rooms = new Map<string, string[]>();
  const connections: Map<string, MessageHandlers> = new Map();

  const send = (
    roomCode: string,
    event: Message,
    ignoreConnection?: string,
  ) => {
    const connectionIds = rooms.get(roomCode);
    if (!connectionIds) {
      return;
    }

    for (const connectionId of connectionIds) {
      if (connectionId === ignoreConnection) {
        continue;
      }

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
        send(roomCode, event, id);
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

const makeRoom = (
  roomId: string,
  connectionsMap: Map<string, MessageHandlers>,
) => {
  let connections: string[] = [];
  let dictator: string | undefined;
  let scribe: string | undefined;
  let broadcast = (message: Message, sourceId?: string) => {
    for (const connection of connections) {
      let method = connectionsMap.get(connection)?.[message.type];
      if (!method) {
        continue;
      }

      // @ts-ignore
      method(message);
    }
  };

  return {
    removeConnection: (connectionId: string) => {
      connections = connections.filter((x) => x !== connectionId);
      connectionsMap.delete(connectionId);

      if (scribe === connectionId) {
        scribe = undefined;
      }

      if (dictator === connectionId) {
        dictator = undefined;
      }
    },
    getConnections: () => connections,
    getRoomId: () => roomId,
    getSize: () => connections.length,
    setDictator: (connectionId: string) => {
      if (dictator !== undefined) {
        return false;
      }
      dictator = connectionId;
      return true;
    },
    setScribe: (connectionId: string) => {
      if (scribe !== undefined) {
        return false;
      }
      scribe = connectionId;
      return true;
    },
  };
};
