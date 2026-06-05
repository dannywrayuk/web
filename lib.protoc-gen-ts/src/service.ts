import proto from "google-protobuf/google/protobuf/descriptor_pb.js";
import { protoNameToTypeName } from "./util.ts";

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

export const generateMethod = (method: proto.MethodDescriptorProto) => {
  const name = method.getName();
  if (!name) {
    throw new Error("Method has no name");
  }
  const inputType = method.getInputType();
  if (!inputType) {
    throw new Error("Method has no input type");
  }
  const outputType = method.getOutputType();
  if (!outputType) {
    throw new Error("Method has no output type");
  }
  return methodTemplate(name, inputType, outputType);
};

export const generateService = (service: proto.ServiceDescriptorProto) => {
  console.warn("🚀 Generating service " + service.getName());
  const name = service.getName();
  if (!name) {
    throw new Error("Service has no name");
  }
  const methods = service
    .getMethodList()
    .map((m) => generateMethod(m))
    .join("\n\n");

  return methods;
};
