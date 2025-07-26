import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { WSContext } from "hono/ws";
import { nanoid } from "nanoid";
import { makeRoomManager } from "./rooms";

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
    let conn = roomManager.register(c.req.param("id"));

    return {
      async onMessage(message, ws) {
        if (typeof message.data === "string") {
        }
      },
      async onOpen(_ev, ws) {
        conn.on("connect", () => {
          ws.send("User connected");
        });
        conn.on("disconnect", () => {
          ws.send("User disconnected");
        });

        conn.broardcast({ type: "connect" });
      },
      async onClose() {
        conn.broardcast({ type: "disconnect" });
        conn.remove();
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
