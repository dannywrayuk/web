import { type ServiceDefinition } from "./generate.ts";

const toOptional = (type: string, isOptional: boolean) =>
  `${type}${isOptional ? " | undefined" : ""}`;

const toArray = (type: string, isArray: boolean) =>
  isArray ? `(${type})[]` : type;

export const protoNameToTypeName = (messageName?: string) => {
  if (!messageName) {
    throw new Error("Message has no name");
  }
  return (
    messageName.startsWith(".") ? messageName.slice(1) : messageName
  ).replace(/\./g, "_");
};

const fieldsToType = (
  fields: ServiceDefinition["messages"][string]["fields"],
) => {
  return Object.values(fields)
    .map((field) => {
      const type = toOptional(
        toArray(protoNameToTypeName(field.type), !!field.options.repeated),
        !(field.options.validation as string)?.includes("required"),
      );
      return `${protoNameToTypeName(field.name)}: ${type};`;
    })
    .join(" ");
};

const messageToType = (message: ServiceDefinition["messages"][string]) => {
  const fields = fieldsToType(message.fields);
  return `export type ${protoNameToTypeName(message.name)} = {${fields}};`;
};

export const asFile = (serviceDefinition: ServiceDefinition) => {
  const messages = Object.values(serviceDefinition.messages)
    .map((message) => messageToType(message))
    .join("\n");
  return messages;
};
