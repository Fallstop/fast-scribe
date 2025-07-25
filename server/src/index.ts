// index.ts
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { WSContext } from "hono/ws";
import type { Message, MessageMap } from "common";

type MessageHandlers = {
  [t in keyof MessageMap]?: (msg: MessageMap[t]) => void;
};

const makeRoomManager = () => {
  const rooms = new Map<string, string[]>();
  const connections: Map<string, MessageHandlers> = {};

  return {
    register(roomCode: string) {
      const id = rooms.get("");
      return {
        on<T extends keyof MessageMap>(message: T, event: MessageMap[T]) {},
      };
    },
    send(roomCode: string, event: Message) {
      rooms.get(roomCode)?.forEach((connection) => {
        if (connection[event.type]) {
        }
      });
    },
  };
};

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const roomManager = makeRoomManager();

// Regular HTTP route
app.get("/", (c) => c.text("Hello from Hono!"));

app.post("/create-room", (c) => c.text("Your new room"));

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
