export const ErrorBubble = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center mt-20">
      <div className="bg-red-950 border-1 border-red-800 p-8 rounded-lg w-full max-w-md">
        <p>{message}</p>
      </div>
    </div>
  );
};
