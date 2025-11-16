export const handler = async (event: any) => {
  return { statusCode: 200, body: "Hello from svc.{{name}}!" };
};
