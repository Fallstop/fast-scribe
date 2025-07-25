import { Server } from "socket.io";
import { type Plugin } from "vite";

export const configureServer: Plugin["configureServer"] = (server) => {
    const { httpServer } = server;
  if (!httpServer) {
    return;
  }

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    socket.on("message", (data, isBinary) => {
      console.log(`Recieved ${data}`);

      socket.emit("message", "Can I put my balls in your jaw?")
    });

    socket.send("test from server");
  });
};

export const sockets: Plugin = {
  name: "sockets",
  configureServer,
};
