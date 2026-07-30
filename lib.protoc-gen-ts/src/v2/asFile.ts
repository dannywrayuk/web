import { type ServiceDefinition } from "./generate.ts";

const helperMap: Record<string, string> = {
  results: 'import { ok, err, type Result } from "@dannywrayuk/results";',
  "message.Empty": `type Empty = Record<string, never>;
  const validateEmpty = (o: Record<string, any>): Result<Empty> => {
    if (typeof o !== "object" || o === null) { return err(null, "Empty is not an object") }
    return ok(o as Empty);
  }
    `,
  allowAny: "/* eslint-disable @typescript-eslint/no-explicit-any */",
  methodHandler: `import { methodHandler, type HandlerContext } from "@dannywrayuk/service-platform/methodHandler";`,
};

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

const fieldToValidationStatement = (
  field: ServiceDefinition["messages"][string]["fields"][string],
) => {
  const fieldName = protoNameToTypeName(field.name);
  const fieldType = protoNameToTypeName(field.type);
  const isRequired = (field.options.validation as string)?.includes("required");
  const isRepeated = !!field.options.repeated;
  const isMessageType = field.type.startsWith(".");

  if (isMessageType) {
    const typeCheck = `
    const [, ${fieldName}Error] = validate${fieldType}(o.${fieldName});
    if (${fieldName}Error) { return err(${fieldName}Error, "${fieldName} is not valid") }`;

    const repeatedCheck = isRepeated
      ? `
    if (!Array.isArray(o.${fieldName})) { return err(null, "${fieldName} is not an array") }
    for (const ${fieldName}Entry of o.${fieldName}) {
      const [, ${fieldName}EntryError] = validate${fieldType}(${fieldName}Entry);
      if (${fieldName}EntryError) { return err(${fieldName}EntryError, "entry of ${fieldName} is invalid") }
    }`
      : typeCheck;

    const requiredCheck = isRequired
      ? repeatedCheck
      : `
      if (o.${fieldName} !== undefined) {
      ${repeatedCheck}
      }`;

    return requiredCheck;
  }

  const typeCheck = `if(typeof o.${fieldName} !== "${fieldType}") { return err(null, "${fieldName} is not a ${fieldType}") }`;

  const repeatedCheck = isRepeated
    ? `
    if(Array.isArray(o.${fieldName})) { return err(null, "${fieldName} is not an array") }
    for (const ${fieldName}Entry of o.${fieldName}) {
      if(typeof ${fieldName}Entry !== "${fieldType}") { return err(null, "entry of ${fieldName} is not a ${fieldType}") }
    }`
    : typeCheck;

  const requiredCheck = isRequired
    ? repeatedCheck
    : `
    if (o.${fieldName} !== undefined) {
      ${repeatedCheck}
    }`;

  return requiredCheck;
};

const messageToValidationFunction = (
  message: ServiceDefinition["messages"][string],
) => {
  const typeName = protoNameToTypeName(message.name);
  return `export const validate${typeName} = (o: Record<string, any>): Result<${typeName}> => {
    if (typeof o !== "object" || o === null) { return err(null, "${typeName} is not an object") }
    ${Object.values(message.fields)
      .map((field) => fieldToValidationStatement(field))
      .join("\n")}
      return ok(o as ${typeName});
  }`;
};

const methodToFunction = (method: ServiceDefinition["methods"][string]) => {
  const methodName =
    method.name[0].toLowerCase() + method.name.slice(1) + "Method";
  const inputType = protoNameToTypeName(method.inputType);
  const outputType = protoNameToTypeName(method.outputType);
  if (!implementationHelpers.includes("methodHandler")) {
    implementationHelpers.push("methodHandler");
  }
  return `export const ${methodName} = async (handler: (event: ${inputType}, context: HandlerContext) => Promise<Result<${outputType}>>) => {
    return methodHandler(
      handler,
      validate${inputType},
      validate${outputType},
    );
  }`;
};

const implementationHelpers = ["allowAny", "results"];
export const asFile = (serviceDefinition: ServiceDefinition) => {
  const messages = Object.values(serviceDefinition.messages)
    .map((message) =>
      [messageToType(message), messageToValidationFunction(message)].join("\n"),
    )
    .join("\n");
  const methods = Object.values(serviceDefinition.methods)
    .map((method) => methodToFunction(method))
    .join("\n");
  const helpers = [
    ...implementationHelpers,
    ...Object.keys(serviceDefinition.helpers),
  ]
    .map((i) => helperMap[i])
    .join("\n");
  return [helpers, messages, methods].join("\n");
};
