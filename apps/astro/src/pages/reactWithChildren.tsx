export const ReactWithChildren = ({ children, name }: any) => {
  return (
    <div>
      <h2>React With children - {name}</h2>
      {children}
    </div>
  );
};
