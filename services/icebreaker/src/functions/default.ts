import { env, stateTable } from "./default.gen";
import { logger } from "@dannywrayuk/logger";
import { createApiClient } from "./lib/apiClient";
import { replyToConnection } from "./lib/replyToConnection";
import { randomUUID } from "crypto";

const setParticipant = async (
  sessionId: string,
  user: { connectionId: string; name: string },
) => {
  const [_, putErr] = await stateTable.put({
    Item: {
      PK: `SESSION#${sessionId}`,
      SK: `PARTICIPANT#${user.name}`,
      connectionId: user.connectionId,
      name: user.name,
    },
    overwrite: true,
  });
  if (putErr) {
    logger.error("Error adding participant", putErr);
    throw putErr;
  }
};

const getParticipants = async (sessionId: string) => {
  const [rsp, queryErr] = await stateTable.query({
    PK: `SESSION#${sessionId}`,
    SK: "PARTICIPANT",
  });
  if (queryErr) {
    logger.error("Error getting participants", queryErr);
    throw queryErr;
  }
  if (!rsp.Items || rsp.Items.length === 0) {
    logger.error("No participants found for " + sessionId);
    throw new Error("No participants found for  " + sessionId);
  }
  return rsp.Items.map((item) => ({
    name: item.name as string,
    connectionId: item.connectionId as string,
  }));
};

const setPresenter = async (sessionId: string, connectionId: string) => {
  const [_, putErr] = await stateTable.put({
    Item: {
      PK: `SESSION#${sessionId}`,
      SK: "PRESENTER",
      connectionId,
    },
    overwrite: true,
  });
  if (putErr) {
    logger.error("Error saving presenter", putErr);
    throw putErr;
  }
};

const getPresenter = async (sessionId: string) => {
  const [rsp, queryErr] = await stateTable.query({
    PK: `SESSION#${sessionId}`,
    SK: "PRESENTER",
  });
  if (queryErr) {
    logger.error("Error getting presenter", queryErr);
    throw queryErr;
  }
  if (!rsp.Items || rsp.Items.length === 0) {
    logger.error("No presenter found for session " + sessionId);
    throw new Error("No presenter found for session " + sessionId);
  }
  return { connectionId: rsp.Items[0].connectionId as string };
};

const setQuestions = async (sessionId: string, questions: string[]) => {
  const [_, putErr] = await stateTable.put({
    Item: {
      PK: `SESSION#${sessionId}`,
      SK: "QUESTIONS",
      questions,
    },
    overwrite: true,
  });
  if (putErr) {
    logger.error("Error saving questions", putErr);
    throw putErr;
  }
};

const getQuestion = async (sessionId: string, questionNumber: number) => {
  const [rsp, queryErr] = await stateTable.query({
    PK: `SESSION#${sessionId}`,
    SK: "QUESTIONS",
  });
  if (queryErr) {
    logger.error("Error getting questions", queryErr);
    throw queryErr;
  }
  if (!rsp.Items || rsp.Items.length === 0) {
    logger.error("No questions found for session " + sessionId);
    throw new Error("No questions found for session " + sessionId);
  }
  return rsp.Items[0].questions[questionNumber] as string;
};

export const handler = async (event: any) => {
  const { connectionId } = event.requestContext;
  const body = event.body ? JSON.parse(event.body) : {};
  logger
    .setDebug(env.stage === "dev")
    .attach({
      name: env.functionName,
      service: env.serviceName,
      stage: env.stage,
    })
    .info("start");

  logger.info("event", event);
  const apiClient = createApiClient(event.requestContext);

  switch (body.action) {
    case "create":
      const sessionId = randomUUID();
      await setPresenter(sessionId, connectionId);
      await setQuestions(sessionId, body.questions);
      await replyToConnection(apiClient, connectionId, {
        action: "created",
        sessionId,
      });
      break;
    case "start": {
      const participants = await getParticipants(body.sessionId);
      const questionText = await getQuestion(
        body.sessionId,
        body.questionNumber,
      );
      await setPresenter(body.sessionId, connectionId);
      const question = {
        action: "question",
        question: questionText,
        questionNumber: body.questionNumber,
        answerOptions: participants.map((p) => p.name),
      };
      await replyToConnection(apiClient, connectionId, question);
      for (const participant of participants) {
        await replyToConnection(apiClient, participant.connectionId, question);
      }
      break;
    }
    case "join": {
      const presenter = await getPresenter(body.sessionId);
      await setParticipant(body.sessionId, {
        connectionId,
        name: body.name,
      });
      await replyToConnection(apiClient, presenter.connectionId, {
        action: "joined",
        name: body.name,
      });
      break;
    }
    case "vote": {
      const presenter = await getPresenter(body.sessionId);
      await replyToConnection(apiClient, presenter.connectionId, {
        action: "voted",
        name: body.answer,
      });
      break;
    }
    default:
      logger.warn("Unknown action", body.action);
  }

  return { statusCode: 200 };
};

// query parameters for present connect?

// CLIENT ACTIONS

// create -- could technically be rest
// input array of questions

// start
// input sessionId, questionNumber

// join
// input sessionId name

// vote
// input sessionId, answer

// SERVER RESPONSES

// created - sent to presenter
// input sessionId

// voted - sent to the presenter
// input name, answer

// question - sent to all connections
// input questionText, answerOptions

// joined - sent to presenter
// input name
