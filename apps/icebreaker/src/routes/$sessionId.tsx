import { Loading, LoadingMessage } from "@/components/Loading";
import { session } from "@/sessionSocket";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const InitialScene = () => {
  const join = useMutation({
    mutationFn: async (name?: string) => session.join(name),
  });
  const nameRef = useRef<string | undefined>(undefined);
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-u0 text-4xl font-bold">Icebreaker</h1>
        <p className="mt-8">Enter your name to join the session.</p>
        <div className="flex flex-col mt-8">
          <input
            type="text"
            placeholder="Your name"
            className="bg-l2 border-1 border-l3 p-2 rounded-lg w-full text-u0"
            maxLength={15}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "");
              nameRef.current = e.target.value;
            }}
          />
          <button
            className="text-u0 bg-github px-4 py-2 rounded-lg w-full text-center mt-4 inline-block cursor-pointer"
            onClick={() => join.mutate(nameRef.current)}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Join session</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const WaitingForQuestionsScene = () => {
  return (
    <Loading>
      <LoadingMessage>Waiting for questions...</LoadingMessage>
    </Loading>
  );
};

export const QuestionScene = () => {
  const { data: state } = useQuery({
    queryKey: ["state"],
    queryFn: () => session.readState(),
  });
  const vote = useMutation({
    mutationFn: async (answer: string) => session.vote(answer),
  });
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <h1 className="text-u0 text-4xl font-bold">
        Question {(state?.question?.number || 0) + 1}.
      </h1>
      <p className="mt-4">{state?.question?.text}</p>
      <div className="flex flex-wrap items-center min-h-[50vh] justify-center max-w-3xl">
        {state?.question?.options?.map((player, index) => (
          <button
            onClick={() => {
              setSelected(player);
            }}
            className={
              "mt-4 mr-4 p-4 rounded-full border-l3 border-2" +
              (selected === player
                ? " bg-dw text-l0 cursor-default"
                : " bg-l1  text-u0 cursor-pointer hover:bg-l2")
            }
            key={index}
          >
            {player}
          </button>
        ))}
        {selected && (
          <button
            className="text-u0 bg-l1 px-4 py-2 rounded-lg w-full text-center mt-8 inline-block cursor-pointer max-w-md"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                vote.mutate(selected);
              }
            }}
          >
            Vote
          </button>
        )}
      </div>
    </div>
  );
};

const EndScene = () => {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="bg-l1 border-1 border-l3 p-8 rounded-lg w-full max-w-md">
        <h1 className="text-u0 text-4xl font-bold">The ice is broken</h1>
        <p className="mt-4">Thank you for playing!</p>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/$sessionId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { sessionId } = Route.useParams();
  const { data: state } = useQuery({
    queryKey: ["state"],
    queryFn: () => session.readState(sessionId),
  });

  if (state?.scene === "initial") {
    return <InitialScene />;
  }
  if (state?.scene === "waiting-for-questions") {
    return <WaitingForQuestionsScene />;
  }
  if (state?.scene === "question") {
    return <QuestionScene />;
  }
  if (state?.scene === "end") {
    return <EndScene />;
  }

  return null;
}
