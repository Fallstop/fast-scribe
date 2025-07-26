import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { WSContext } from "hono/ws";
import { nanoid } from "nanoid";
import { makeRoomManager } from "./rooms.js";
import { Message } from "common";
import { cors } from "hono/cors";

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const roomManager = makeRoomManager();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

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
    let session = roomManager.register(c.req.param("id"));

    return {
      async onMessage(message, ws) {
        if (typeof message.data !== "string") {
          return;
        }

        const msg = JSON.parse(message.data) as Message;
        console.log(msg);
        switch (msg.type) {
          case "current_state":
            session.updateState(msg.value);
            break;
          case "connect":
            if (msg.role === "scribe") {
              if (!session.joinScribe()) {
                ws.send(JSON.stringify({ type: "role_taken" } as Message));
              }
            } else {
              if (!session.joinDictator()) {
                ws.send(JSON.stringify({ type: "role_taken" } as Message));
              }
            }
            break;
          case "start_game":
            session.startGame(msg.duration);
            break;
          case "next_round":
            session.nextRound();
            break;
          default:
            console.log("Unexpected message", msg);
        }
      },
      async onOpen(_ev, ws) {
        const send = (value: Message) => {
          console.log("sending message");
          ws.send(JSON.stringify(value));
        };
        session.all(send);
      },
      async onClose() {
        session.remove();
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
