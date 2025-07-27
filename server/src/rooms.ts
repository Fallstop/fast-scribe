import { GameState, Message, MessageHandlers } from "common";
import { randomUUID } from "crypto";
import { getSentences } from "./potat";

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
          connection["next_sentence"] = connection["next_sentence"] ?? handler;
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

          console.log(rooms);
        },
        broadcast(message: Message) {
          room.broadcast(message, id);
        },
        updateSentence(currentState: string[], sentenceNumber: number) {
          room.updateCurrentSentence(id, currentState, sentenceNumber);
        },
        startGame(duration: number) {
          room.startGame(id, duration);
        },
        nextSentence(rawWpm: number, adjustedWpm: number, finalAccuracy: number) {
          room.saveStats(rawWpm, adjustedWpm, finalAccuracy);
          room.nextSentence(id);
        },
        joinScribe() {
          return room.setScribe(id);
        },
        joinDictator() {
          return room.addDictator(id);
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
  let dictators: string[] = [];
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

      if (dictators.includes(connectionId)) {
        broadcast({ type: "disconnect", role: "dictator" });
        dictators = dictators.filter((x) => x !== connectionId);
        broadcast({ type: "game_state", ...gameState });
      }
    },
    getConnections: () => connections,
    addConnection: (id: string) => (
      connections.push(id), console.log(connections)
    ),
    getRoomId: () => roomId,
    getSize: () => connections.length,
    addDictator: (connectionId: string) => {
      if (dictators.includes(connectionId)) {
        return true;
      }
      dictators.push(connectionId);
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
    updateCurrentSentence: (
      connectionId: string,
      currentState: string[],
      sentenceNumber: number,
    ) => {
      if (!gameState.inPlay || connectionId !== scribe) {
        return;
      }

      gameState.currentState.currentState[sentenceNumber] = currentState;

      broadcast({ type: "current_state", value: currentState, sentenceNumber });
    },
    saveStats(rawWpm: number, adjustedWpm: number, finalAccuracy: number) {
      if (!gameState.inPlay || !scribe) {
        return;
      }

      gameState.currentState.stats.push({
        rawWpm,
        adjustedWpm,
        finalAccuracy,
      });
    },
    nextSentence: (connectionId: string) => {
      if (!gameState.inPlay || connectionId !== scribe) {
        return;
      }

      gameState.currentState.currentState.push([]);
      gameState.currentState.sentenceNumber += 1;

      broadcast({ type: "game_state", ...gameState });
    },
    startGame: async (connectionId: string, duration: number) => {
      if (gameState.inPlay || connectionId !== scribe) {
        return;
      }

      let now = new Date();
      let words: string[][] | undefined;
      try {
        const obj = await getSentences();
        words = obj.sentences;
        console.log(words);
      } catch (ex) {
        console.error(ex);
      }

      console.log(words);

      gameState = {
        inPlay: true,
        currentState: {
          endsAt: now.getTime() + duration * 1000,
          endsIn: duration,
          currentState: [[]],
          sentenceNumber: 0,
          started: now.getTime(),
          words: words ?? [
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
            "I just lost the game.".split(" "),
            "Final boss:".split(" "),
            "I EYE eye eYe I aye I i".split(" "),
            "one more...".split(" "),
            "RICK".split(" "),
            "yippee!".split(" "),
          ],
          stats: [],
        },
      };

      broadcast({ type: "game_state", ...gameState });
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
