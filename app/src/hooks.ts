import * as skio from "sveltekit-io";

import {browser} from "$app/environment";
import type { Server } from "socket.io";
import type Client from 'socket.io-client';
import type { Handle } from "@sveltejs/kit";

skio.setup('http://localhost:3001', {
  cors: {
    origin     : "http://localhost:5173",
    credentials: true,
  },
}).then((io: Server) => {

  if ( browser )
    return;

  io.on('connect', socket => {

    socket.on('message', message => {

      console.log(socket.id, "Client sent:", message);

      socket.emit('message', {message: 'Hello from server !'});
    });
  });
});

export const handle: Handle = async ({ event, resolve }: { event: any, resolve: any }) => {

  if ( !browser )
    skio.get()?.emit('message', {message: `New request: ${event.request.url}`} );

  return await resolve(event);
}