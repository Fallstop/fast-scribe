// index.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from "@hono/node-ws";
import type { Server as HTTPServer } from 'http';
import { WSContext } from 'hono/ws';

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })


const ids = new Map<string, WSContext<WebSocket>[]>();

// Regular HTTP route
app.get('/', (c) => c.text('Hello from Hono!'));

app.get("/ws/:id", upgradeWebSocket((c) => ({
    async onMessage(message, ws) {
        if (typeof message.data === "string") {

        }
    },
    async onOpen(_ev, ws) {
        const arr = ids.get(c.req.param("id")) ?? [];
        
        ids.set(c.req.param("id"), ws);
        console.log("Connected")
    }
})))

// Create Hono HTTP server
const server = serve(
  {
    fetch: app.fetch,
    port: 42069,
    hostname: "0.0.0.0"
    // optionally createServer/createSecureServer for http2 or https
  },
  (info) => {
    console.log(`Listening on http://${info.address}:${info.port}`);
  }
);
injectWebSocket(server)