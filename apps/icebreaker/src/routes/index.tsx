import { createFileRoute } from "@tanstack/react-router";
import { QuestionScene } from "./present";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <QuestionScene />;
}
