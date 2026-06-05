export const protoNameToTypeName = (messageName?: string) => {
  if (!messageName) {
    throw new Error("Message has no name");
  }
  return (
    messageName.startsWith(".") ? messageName.slice(1) : messageName
  ).replace(/\./g, "_");
};
