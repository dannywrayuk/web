import { type ServiceDefinition } from "./generate.ts";
import { variableToTypeString } from "./variableToTypeString.ts";
import * as fs from "node:fs";

const helperMap: Record<string, string> = {
  results: 'import { ok, err, type Result } from "@dannywrayuk/results";',
  "message.Empty": `type Empty = Record<string, never>;
  const validateEmpty = (o: Record<string, any>): Result<Empty> => {
    if (typeof o !== "object" || o === null) { return err(null, "Empty is not an object") }
    return ok(o as Empty);
  }
    `,
  allowAny: "/* eslint-disable @typescript-eslint/no-explicit-any */",
  methodHandler: `import { methodHandler } from "@dannywrayuk/service-platform/methodHandler";`,
  methodHttpHandler: `import { methodHttpHandler } from "@dannywrayuk/service-platform/methodHttpHandler";`,
  handlerContext: `import { HandlerContext } from "@dannywrayuk/service-platform/HandlerContext";`,
  toHttpCookies: `import { toHttpCookies } from "@dannywrayuk/service-platform/toHttpCookies";`,
  fromHttpCookies: `import { fromHttpCookies } from "@dannywrayuk/service-platform/fromHttpCookies";`,
  toHttpHeaders: `import { toHttpHeaders } from "@dannywrayuk/service-platform/toHttpHeaders";`,
  fromHttpHeaders: `import { fromHttpHeaders } from "@dannywrayuk/service-platform/fromHttpHeaders";`,
  toHttpQuery: `import { toHttpQuery } from "@dannywrayuk/service-platform/toHttpQuery";`,
  fromHttpQuery: `import { fromHttpQuery } from "@dannywrayuk/service-platform/fromHttpQuery";`,
  toHttpStatus: `import { toHttpStatus } from "@dannywrayuk/service-platform/toHttpStatus";`,
  fromHttpStatus: `import { fromHttpStatus } from "@dannywrayuk/service-platform/fromHttpStatus";`,
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
        !["required", "query", "cookies", "headers", "status"].some((r) =>
          (field.options.validation as string)?.includes(r),
        ),
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
  const isRequired = ["required", "query", "cookies", "headers", "status"].some(
    (r) => (field.options.validation as string)?.includes(r),
  );
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
  const methodName = method.name[0].toLowerCase() + method.name.slice(1);
  const inputType = protoNameToTypeName(method.inputType);
  const outputType = protoNameToTypeName(method.outputType);

  if (
    method.options.api !== "http" &&
    !implementationHelpers.includes("methodHandler")
  ) {
    implementationHelpers.push("methodHandler");
  }

  if (
    method.options.api === "http" &&
    !implementationHelpers.includes("methodHttpHandler")
  ) {
    implementationHelpers.push("methodHttpHandler");
  }

  if (!implementationHelpers.includes("handlerContext")) {
    implementationHelpers.push("handlerContext");
  }

  const secretsConst = method.options.secrets
    ? `export const ${methodName}Secrets = ${JSON.stringify(method.options.secrets as string[])} as const;`
    : "";
  const secretsType = secretsConst ? `typeof ${methodName}Secrets` : "[]";

  const handlerType =
    method.options.api === "http" ? "methodHttpHandler" : "methodHandler";
  const handlerInputs =
    method.options.api === "http"
      ? `validate${inputType},
      validate${outputType}, 
      ${needsMarshaling[method.inputType] ? `marshalHttpTo${inputType}` : "null"},
      ${needsMarshaling[method.outputType] ? `unmarshal${outputType}ToHttp` : "null"}`
      : `validate${inputType},
      validate${outputType}`;

  return `${secretsConst}
  export const ${methodName} = (handler: (event: ${inputType}, context: HandlerContext<Env, ${secretsType}>) => Promise<Result<${outputType}>>) => {
    return ${handlerType}(
      handler,
      ${secretsConst ? `${methodName}Secrets` : "[]"},
      ${handlerInputs}
    );
  }`;
};

const findMarshalingMessages = (serviceDefinition: ServiceDefinition) => {
  Object.values(serviceDefinition.methods)
    .filter((method) => method.options.api === "http")
    .forEach((method) => {
      const inputMessage = serviceDefinition.messages[method.inputType];
      const outputMessage = serviceDefinition.messages[method.outputType];

      if (
        inputMessage &&
        Object.values(inputMessage.fields).some((field) =>
          ["query", "headers", "cookies"].some((v) =>
            (field.options.validation as string)?.includes(v),
          ),
        )
      ) {
        needsMarshaling[inputMessage.name] = "fromHttp";
      }

      if (
        outputMessage &&
        Object.values(outputMessage.fields).some((field) =>
          ["status", "headers", "cookies"].some((v) =>
            (field.options.validation as string)?.includes(v),
          ),
        )
      ) {
        needsMarshaling[outputMessage.name] = "toHttp";
      }
    });
};

const configToEnvironment = (config: ServiceDefinition["config"]) => {
  return `
export type CommonEnv = ${variableToTypeString(config["*"])} & { stage: string };
${Object.keys(config)
  .filter((key) => key !== "*")
  .map(
    (key) =>
      `export type Env_${key} = ${variableToTypeString(config[key])} & { stage: "${key}" };`,
  )
  .join("\n")}
export type Env = CommonEnv & (Env_dev | Env_prod);
`;
};

const httpEventToMessage = (
  message: ServiceDefinition["messages"][string],
  serviceDefinition: ServiceDefinition,
) => {
  const cookieParam = Object.values(message.fields).find((field) =>
    (field.options.validation as string)?.includes("cookies"),
  )?.name;
  const queryParam = Object.values(message.fields).find((field) =>
    (field.options.validation as string)?.includes("query"),
  )?.name;
  const headersParam = Object.values(message.fields).find((field) =>
    (field.options.validation as string)?.includes("headers"),
  )?.name;

  const cookies = cookieParam
    ? `${cookieParam}: fromHttpCookies(event.cookies,[${Object.keys(
        serviceDefinition.messages[message.fields[cookieParam].type].fields,
      )
        .map((f) => `"${f}"`)
        .join()}]),`
    : "";
  const headers = headersParam
    ? `${headersParam}: fromHttpHeaders(event.headers),`
    : "";
  const query = queryParam
    ? `${queryParam}: fromHttpQuery(event.queryStringParameters),`
    : "";

  if (cookies && !implementationHelpers.includes("fromHttpCookies")) {
    implementationHelpers.push("fromHttpCookies");
  }
  if (headers && !implementationHelpers.includes("fromHttpHeaders")) {
    implementationHelpers.push("fromHttpHeaders");
  }
  if (query && !implementationHelpers.includes("fromHttpQuery")) {
    implementationHelpers.push("fromHttpQuery");
  }

  return `export const marshalHttpTo${protoNameToTypeName(message.name)} = (event: any) => {
    return {
      ...event.body,${cookies}${query}${headers}
    }
  }`;
};

const messageToHttpResponse = (
  message: ServiceDefinition["messages"][string],
) => {
  const cookieParam = Object.values(message.fields).find((field) =>
    (field.options.validation as string)?.includes("cookies"),
  )?.name;
  const headersParam = Object.values(message.fields).find((field) =>
    (field.options.validation as string)?.includes("headers"),
  )?.name;
  const statusParam = Object.values(message.fields).find((field) =>
    (field.options.validation as string)?.includes("status"),
  )?.name;

  const cookies = cookieParam ? `${cookieParam}: cookies,` : "";
  const headers = headersParam ? `${headersParam}: headers,` : "";
  const status = statusParam ? `${statusParam}: status,` : "";

  if (cookies && !implementationHelpers.includes("toHttpCookies")) {
    implementationHelpers.push("toHttpCookies");
  }
  if (headers && !implementationHelpers.includes("toHttpHeaders")) {
    implementationHelpers.push("toHttpHeaders");
  }
  if (status && !implementationHelpers.includes("toHttpStatus")) {
    implementationHelpers.push("toHttpStatus");
  }

  return `export const unmarshal${protoNameToTypeName(message.name)}ToHttp = (response: any) => {
    const {${cookies}${headers}${status} ...body} = response;
    return {
      body,${cookies ? `cookies: toHttpCookies(cookies)` : ""}${headers ? `headers: toHttpHeaders(headers),` : ""}${status ? `statusCode: toHttpStatus(status),` : ""}
    }
  }`;
};

const createMarshalingFunctions = (serviceDefinition: ServiceDefinition) => {
  return Object.entries(needsMarshaling).map(([messageName, direction]) => {
    const message = serviceDefinition.messages[messageName];
    if (!message) {
      throw new Error(`Message not found: ${messageName}`);
    }
    Object.values(message.fields)
      .filter((field) =>
        ["query", "headers", "cookies", "status"].some((v) =>
          (field.options.validation as string)?.includes(v),
        ),
      )
      .forEach((field) => {
        if (!field.type.startsWith(".")) {
          throw new Error(
            `Field ${field.name} in message ${messageName} is marked for http marshaling but is not a message type`,
          );
        }
        if (
          Object.values(serviceDefinition.messages[field.type].fields).some(
            (f) => f.type.startsWith("."),
          )
        ) {
          throw new Error(
            `Field ${field.name} in message ${messageName} is marked for http marshaling but contains a message`,
          );
        }
      });
    if (direction === "fromHttp") {
      return httpEventToMessage(message, serviceDefinition);
    } else if (direction === "toHttp") {
      return messageToHttpResponse(message);
    } else {
      throw new Error(`Unknown marshaling direction: ${direction}`);
    }
  });
};

const createHandlers = (serviceDefinition: ServiceDefinition) => {
  Object.values(serviceDefinition.methods).forEach((method) => {
    const methodName = method.name[0].toLowerCase() + method.name.slice(1);
    const fileExists = fs.existsSync(`src/handlers/${method.name}.ts`);
    if (!fileExists) {
      const handlerContent = `import { ${methodName} } from "../../generated/service.ts";
import { err } from "@dannywrayuk/results";

export default ${methodName}(async () => {
  return err(null, "Not implemented");
});
`;
      if (!fs.existsSync("src/handlers")) {
        fs.mkdirSync("src/handlers");
      }
      fs.writeFileSync(`src/handlers/${methodName}.ts`, handlerContent);
    }
  });
};

const implementationHelpers = ["allowAny", "results"];
const needsMarshaling = {} as Record<string, "fromHttp" | "toHttp">;
export const asFile = (serviceDefinition: ServiceDefinition) => {
  findMarshalingMessages(serviceDefinition);
  const environment = configToEnvironment(serviceDefinition.config);
  const messages = Object.values(serviceDefinition.messages)
    .map((message) =>
      [messageToType(message), messageToValidationFunction(message)].join("\n"),
    )
    .join("\n");

  const methods = Object.values(serviceDefinition.methods)
    .map((method) => methodToFunction(method))
    .join("\n");

  const marshalingFunctions =
    createMarshalingFunctions(serviceDefinition).join("\n");

  const helpers = [
    ...implementationHelpers,
    ...Object.keys(serviceDefinition.helpers),
  ]
    .map((i) => helperMap[i])
    .join("\n");

  createHandlers(serviceDefinition);

  return [helpers, environment, messages, marshalingFunctions, methods].join(
    "\n",
  );
};
