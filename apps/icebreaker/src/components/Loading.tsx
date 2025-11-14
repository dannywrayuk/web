import React from "react";
import { PiSpinnerBold } from "react-icons/pi";

export const Loading = ({
  children,
  spinner,
}: {
  children: React.ReactNode;
  spinner?: boolean;
}) => {
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center">
      {spinner && (
        <PiSpinnerBold className="text-dw size-[2em] animate-[spin_3s_linear_infinite]" />
      )}
      {children}
    </div>
  );
};

export const LoadingMessage = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-u2">{children}</div>;
};
