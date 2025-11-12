import { session } from "@/sessionSocket";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

const InitialScene = () => {
  const questionsInputRef = useRef<string>("");
  const create = useMutation({
    mutationFn: async (questions: string[]) => session.create(questions),
  });

  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-u0 text-4xl font-bold">Presenter Mode</h1>
        <p className="mt-8">
          You are now in presenter mode. Create a new session below.
        </p>
        <div className="flex flex-col mt-8">
          <textarea
            placeholder="Enter questions, one per line"
            className="bg-l2 border-1 border-l3 p-2 rounded-lg w-full text-u0 h-40"
            id="questions"
            onChange={(e) => {
              questionsInputRef.current = e.target.value;
            }}
          />
          <button
            className="text-u0 bg-github px-4 py-2 rounded-lg w-full text-center mt-4 inline-block cursor-pointer"
            onClick={() => create.mutate(questionsInputRef.current.split("\n"))}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Create session</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export const WaitingForPlayersScene = () => {
  const { data } = useQuery({
    queryKey: ["state"],
    queryFn: () => session.readState(),
  });
  const start = useMutation({
    mutationFn: async () => session.start(),
  });
  const gameLink = `${window.location.origin}/${data?.sessionId}`;
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-u0 text-4xl font-bold">Waiting for players...</h1>
      <p className="mt-4 text-u1 underline block">{gameLink}</p>
      <div className="flex flex-wrap items-center min-h-[50vh] justify-center max-w-3xl">
        {data?.players.map((player, index) => (
          <p
            className="mt-4 text-u0 mr-4 bg-l1 p-4 rounded-full border-l3 border-2"
            key={index}
          >
            {player}
          </p>
        ))}
      </div>
      <button
        className="text-u0 bg-github px-4 py-2 rounded-lg w-full text-center mt-8 inline-block cursor-pointer max-w-md"
        onClick={() => start.mutate()}
      >
        <div className="flex items-center justify-center gap-2">
          <span>Start</span>
        </div>
      </button>
    </div>
  );
};

export const QuestionScene = () => {
  const { data: state } = useQuery({
    queryKey: ["state"],
    queryFn: () => session.readState(),
  });
  const [reveal, setReveal] = useState(false);
  const start = useMutation({
    mutationFn: async () => session.start(),
  });
  if (!state) return null;
  const max = Math.max(...Object.values(state.votes).map((v) => v.length));
  const winners = Object.entries(state.votes)
    .filter(([, v]) => v.length === max)
    .map(([name]) => name)
    .join(", ");
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-u0 text-6xl font-bold">
        Question {(state?.question?.number || 0) + 1}.
      </h1>
      <p className="mt-4 text-4xl">{state?.question?.text}</p>
      <div className="flex items-end gap-2 w-full px-8 py-16 rounded h-[50vh]">
        {Object.entries(state.votes).map(([voteName, voteValues], idx) => (
          <div
            key={idx + "question" + (state?.question?.number || 0)}
            className="flex flex-col items-center justify-end h-full"
            style={{ flex: 1 }}
          >
            <div
              className={
                "w-5 rounded-t" +
                (reveal && voteValues.length === max
                  ? " bg-blue-500"
                  : " bg-dw")
              }
              style={{
                height: `${(voteValues.length / max) * 30}vh`,
              }}
            ></div>
            {
              <span className={"text-lg mt-2" + (reveal ? "" : " opacity-0")}>
                {voteName}
                <br />({voteValues.length})
              </span>
            }
          </div>
        ))}
      </div>
      <div>
        {reveal && (
          <h2 className="text-u0 text-4xl font-bold mt-4">{winners}</h2>
        )}
      </div>
      <button
        className="text-u0 bg-github px-4 py-2 rounded-lg w-full text-center mt-8 inline-block cursor-pointer max-w-md"
        onClick={() => {
          if (reveal) {
            start.mutate();
            setReveal(false);
          } else {
            setReveal(true);
          }
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span>{reveal ? "Next Question" : "Reveal"}</span>
        </div>
      </button>
    </div>
  );
};

export const EndScene = () => {
  const { data: state } = useQuery({
    queryKey: ["state"],
    queryFn: () => session.readState(),
  });
  const scores = (
    state?.players?.map((player) => ({
      name: player,
      score: state.scores[player] || 0,
    })) || []
  ).sort((a, b) => b.score - a.score);
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-u0 text-4xl font-bold">The ice is now broken</h1>
      <p className="mt-4">Thank you for playing!</p>
      <h2 className="text-u0 text-2xl font-bold mt-8">Final Scores</h2>
      <div className="flex flex-col mt-4">
        {scores.map((score, index) => (
          <p
            className="mt-2 text-u0 mr-4 bg-l1 p-4 rounded-md border-l3 border-2"
            key={index + (state?.sessionId || "")}
          >
            <span className="font-bold mr-2">{index + 1}.</span>
            <span>
              {score.name}: {score.score}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/present")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useQuery({
    queryKey: ["state"],
    queryFn: () => session.readState(),
  });

  if (data?.scene === "initial") {
    return <InitialScene />;
  }

  if (data?.scene === "waiting-for-players") {
    return <WaitingForPlayersScene />;
  }
  if (data?.scene === "question") {
    return <QuestionScene />;
  }
  if (data?.scene === "end") {
    return <EndScene />;
  }
  return null;
}
