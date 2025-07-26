import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { WSContext } from "hono/ws";
import type { Message, MessageMap } from "common";
import { randomUUID } from "crypto";
import { nanoid } from "nanoid";

type MessageHandlers = {
  [t in keyof MessageMap]?: (msg: MessageMap[t]) => void;
};

const makeRoomManager = () => {
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

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const roomManager = makeRoomManager();

// Regular HTTP route
app.get("/", (c) => c.text("Hello from Hono!"));

app.post("/create-room", (c) =>
  c.json({
    roomCode: nanoid(10),
  }),
);

app.get(
  "/ws/:id",
  upgradeWebSocket((c) => {
    let id = 0;
    let ws: WSContext<WebSocket>;

    return {
      async onMessage(message, ws) {
        if (typeof message.data === "string") {
        }
      },
      async onOpen(_ev, conn) {
        ws = conn;
        roomManager.register(c.req.param("id"));
      },
    };
  }),
);

// Create Hono HTTP server
const server = serve(
  {
    fetch: app.fetch,
    port: 42069,
    hostname: "0.0.0.0",
    // optionally createServer/createSecureServer for http2 or https
  },
  (info) => {
    console.log(`Listening on http://${info.address}:${info.port}`);
  },
);
injectWebSocket(server);
