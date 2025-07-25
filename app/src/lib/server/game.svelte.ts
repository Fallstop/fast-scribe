import type { Socket } from "socket.io";

const sessions = $state(new Map<string, Socket>());

export { sessions };
