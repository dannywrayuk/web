import { queryClient } from "./queryClient";

export const sessionSocket = () => {
  const websocket = new WebSocket(import.meta.env.VITE_SOCKET_URL);
  const state = {
    scene: "initial",
    sessionId: null as string | null,
    me: null as string | null,
    players: [] as string[],
    question: null as {
      number: number;
      text: string;
      options: string[];
    } | null,
    votes: {} as { [answer: string]: string[] },
    scores: {} as { [player: string]: number },
  };

  websocket.onopen = () => {
    console.log("connected");
  };

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.action) {
      case "created": {
        state.scene = "waiting-for-players";
        state.sessionId = data.sessionId;
        break;
      }
      case "joined": {
        state.players.push(data.name);
        break;
      }
      case "voted": {
        state.votes?.[data.answer].push(data.name);
        break;
      }
      case "question": {
        if (data.questionNumber === -1) {
          state.scene = "end";
          state.question = null;
          state.votes = {};
          break;
        }
        state.scene = "question";
        state.votes = data.answerOptions.reduce(
          (acc: { [answer: string]: string[] }, option: string) => {
            acc[option] = [];
            return acc;
          },
          {},
        );
        state.question = {
          number: data.questionNumber,
          text: data.question,
          options: data.answerOptions,
        };
        break;
      }
    }
    refreshState();
    console.log("message received:", data);
  };

  const send = (action: string, payload: object) => {
    websocket.send(JSON.stringify({ action, ...payload }));
  };

  const refreshState = () => {
    queryClient.invalidateQueries({ queryKey: ["state"] });
  };

  const create = (questions: string[]) => {
    send("create", { questions });
  };

  const start = () => {
    if (state.question !== null) {
      const highestVotedCount = Math.max(
        ...Object.values(state.votes).map((voters) => voters.length),
      );

      const winners = Object.entries(state.votes).reduce((acc, cur) => {
        if (cur[1].length === highestVotedCount) acc.concat(cur[1]);
        return acc;
      }, [] as string[]);

      winners.forEach((winner) => {
        state.scores[winner] = (state.scores[winner] || 0) + 1;
      });
    }
    send("start", {
      sessionId: state.sessionId,
      questionNumber:
        typeof state.question?.number === "number"
          ? state.question.number + 1
          : 0,
    });
  };

  const join = (name: string | undefined) => {
    if (!name) return;
    send("join", { sessionId: state.sessionId, name });
    state.scene = "waiting-for-questions";
    refreshState();
  };

  const vote = (answer: string) => {
    send("vote", { sessionId: state.sessionId, answer, name: state.me });
    state.scene = "waiting-for-questions";
    refreshState();
  };

  const readState = (sessionId?: string) => {
    if (sessionId) state.sessionId = sessionId;
    return { ...state };
  };

  return {
    readState,
    create,
    join,
    vote,
    start,
  };
};

export const session = sessionSocket();
