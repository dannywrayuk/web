export const ComponentA = async ({ a }: { a: any }) => {
  const x = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  // await Bun.sleep(3000);
  return <div>This is a server component {await x.text()}</div>;
};
