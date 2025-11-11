import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/queryClient";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <React.Fragment>
        <Outlet />
      </React.Fragment>
    </QueryClientProvider>
  );
}
