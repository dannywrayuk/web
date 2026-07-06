import proto from "google-protobuf/google/protobuf/descriptor_pb.js";
import { protoNameToTypeName } from "./util.ts";
import { generateMessage } from "./message.ts";

const methodTemplate = (
  name: string,
  inputType: string,
  outputType: string,
) => {
  const tsName = protoNameToTypeName(name);
  const tsInputType = protoNameToTypeName(inputType);
  const tsOutputType = protoNameToTypeName(outputType);
  return `export type ${tsName} = (request: ${tsInputType}) => Promise<Result<${tsOutputType}>>;`;
};

export const generateMethod = (
  fileContents: proto.FileDescriptorProto,
  method: proto.MethodDescriptorProto,
) => {
  const name = method.getName();
  if (!name) {
    throw new Error("Method has no name");
  }
  const inputType = method.getInputType();
  if (!inputType) {
    throw new Error("Method has no input type");
  }
  const inputMessage = fileContents
    .getMessageTypeList()
    .find((m) => m.getName() === inputType.slice(1));
  const inputMessageTemplate = inputMessage
    ? generateMessage(inputMessage)
    : "";

  const outputType = method.getOutputType();
  if (!outputType) {
    throw new Error("Method has no output type");
  }
  const outputMessage = fileContents
    .getMessageTypeList()
    .find((m) => m.getName() === outputType.slice(1));
  const outputMessageTemplate = outputMessage
    ? generateMessage(outputMessage)
    : "";

  return [
    inputMessageTemplate,
    outputMessageTemplate,
    methodTemplate(name, inputType, outputType),
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const generateService = (
  fileContents: proto.FileDescriptorProto,
  service: proto.ServiceDescriptorProto,
) => {
  console.warn("🚀 Generating service " + service.getName());
  const name = service.getName();
  if (!name) {
    throw new Error("Service has no name");
  }
  const methods = service
    .getMethodList()
    .map((m) => generateMethod(fileContents, m))
    .join("\n\n");

  return methods;
};
