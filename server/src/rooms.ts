import { GameState, Message, MessageHandlers } from "common";
import { randomUUID } from "crypto";

export const makeRoomManager = () => {
  const rooms = new Map<string, ReturnType<typeof makeRoom>>();
  const connections = new Map<string, MessageHandlers>();

  return {
    register: (roomCode: string) => {
      let room = rooms.get(roomCode) ?? makeRoom(roomCode, connections);
      let id = randomUUID();
      let connection: MessageHandlers = {};
      connections.set(id, connection);
      rooms.set(roomCode, room);
      room.addConnection(id);

      return {
        on<T extends keyof MessageHandlers>(
          eventType: T,
          handler: MessageHandlers[T],
        ) {
          connection[eventType] = handler;
        },
        all(handler: (ev: Message) => void) {
          connection["words"] = connection["words"] ?? handler;
          connection["connect"] = connection["connect"] ?? handler;
          connection["next_round"] = connection["next_round"] ?? handler;
          connection["disconnect"] = connection["disconnect"] ?? handler;
          connection["game_start"] = connection["game_start"] ?? handler;
          connection["role_taken"] = connection["role_taken"] ?? handler;
          connection["start_game"] = connection["start_game"] ?? handler;
          connection["game_state"] = connection["game_state"] ?? handler;
          connection["current_state"] = connection["current_state"] ?? handler;
          connection["game_start"] = connection["game_start"] ?? handler;
        },
        remove() {
          room.removeConnection(id);
          if (room.getSize() < 1) {
            room.clearInterval();
            rooms.delete(roomCode);
          }
        },
        broadcast(message: Message) {
          room.broadcast(message, id);
        },
        updateState(currentState: string[]) {
          room.updateCurrentSentence(id, currentState);
        },
        startGame(duration: number) {
          room.startRound(id, duration);
        },
        nextRound() {
          room.nextRound(id);
        },
        joinScribe() {
          return room.setScribe(id);
        },
        joinDictator() {
          return room.setDictator(id);
        },
      };
    },
  };
};

type StateObject =
  | { inPlay: false; lastRound?: GameState }
  | { inPlay: true; currentState: GameState };

const makeRoom = (
  roomId: string,
  connectionsMap: Map<string, MessageHandlers>,
) => {
  let connections: string[] = [];
  let dictator: string | undefined;
  let scribe: string | undefined;
  let gameState = {
    inPlay: false,
  } as StateObject;
  let interval: ReturnType<typeof setInterval> | undefined;

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
        broadcast({ type: "disconnect", role: "scribe" });
      }

      if (dictator === connectionId) {
        broadcast({ type: "disconnect", role: "dictator" });
        dictator = undefined;
      }
    },
    getConnections: () => connections,
    addConnection: (id: string) => (
      connections.push(id), console.log(connections)
    ),
    getRoomId: () => roomId,
    getSize: () => connections.length,
    setDictator: (connectionId: string) => {
      if (dictator !== undefined) {
        return false;
      }
      dictator = connectionId;
      broadcast({ type: "connect", role: "dictator" }, connectionId);
      broadcast({ type: "game_state", ...gameState });

      return true;
    },
    setScribe: (connectionId: string) => {
      if (scribe !== undefined) {
        return false;
      }
      scribe = connectionId;
      broadcast({ type: "connect", role: "scribe" }, connectionId);
      broadcast({ type: "game_state", ...gameState });
      return true;
    },
    getGameState: () => gameState,
    updateCurrentSentence: (connectionId: string, currentState: string[]) => {
      if (!gameState.inPlay || connectionId !== scribe) {
        return;
      }

      gameState.currentState.currentState = currentState;
      broadcast({ type: "current_state", value: currentState }, connectionId);
    },
    nextRound: (connectionId: string) => {
      if (!gameState.inPlay || connectionId !== scribe) {
        return;
      }

      gameState.currentState.history.push(gameState.currentState.currentState);
      gameState.currentState.currentState = [];
      gameState.currentState.roundNumber += 1;

      broadcast({ type: "game_state", ...gameState });
    },
    startRound: (connectionId: string, duration: number) => {
      if (
        gameState.inPlay ||
        connectionId !== scribe ||
        dictator === undefined
      ) {
        return;
      }

      let now = new Date();

      gameState = {
        inPlay: true,
        currentState: {
          currentState: [],
          endsAt: now.getTime() + duration,
          endsIn: duration,
          history: [],
          roundNumber: 0,
          started: now.getTime(),
          words: [
            "This is a test sentence.".split(" "),
            "Another sentence to type.".split(" "),
            "Yet another sentence for testing.".split(" "),
            "Final sentence to complete the game.".split(" "),
            "I lied.".split(" "),
            "This is a longer sentence that should be typed out completely.".split(
              " ",
            ),
            "Medium length sentence for the game.".split(" "),
            "Quick brown fox jumps over the lazy dog.".split(" "),
            "Sphinx of black quartz, judge my vow.".split(" "),
            "Pack my box with five dozen liquor jugs.".split(" "),
          ],
        },
      };
      interval = setInterval(() => {
        if (!gameState.inPlay) {
          clearInterval(interval);
          interval = undefined;
          return;
        }

        gameState.currentState.endsIn =
          gameState.currentState.endsAt - new Date().getTime();

        if (gameState.currentState.endsIn < 0) {
          gameState = {
            inPlay: false,
            lastRound: gameState.currentState,
          };

          clearInterval(interval);
          interval = undefined;
          broadcast({ type: "game_state", ...gameState });
          return;
        }

        broadcast({ type: "game_end_in", in: gameState.currentState.endsIn });
      }, 1000);
    },
    clearInterval() {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    },
    broadcast,
  };
};
