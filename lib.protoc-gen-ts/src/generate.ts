import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import { generateMessage } from "./message.ts";
import { generateService } from "./service.ts";

const eslintDisable = `/* eslint-disable @typescript-eslint/no-explicit-any */`;
const imports = `import { type Result, ok, err } from "@dannywrayuk/results";`;

export const generate = (request: proto.CodeGeneratorRequest) => {
  const filesToGenerate = request.getFileToGenerateList();
  if (filesToGenerate.length === 0) {
    return null;
  }

  if (filesToGenerate.length > 1) {
    throw new Error("Multiple files to generate is not supported");
  }

  const fileName = filesToGenerate[0];
  const fileContents = request
    .getProtoFileList()
    .find((f) => f.getName() === fileName);
  if (!fileContents) {
    throw new Error("File not found: " + fileName);
  }
  console.warn("🛠  Generating " + fileName);
  console.warn("💌 Generating message types");
  const messageTypes = fileContents
    ?.getMessageTypeList()
    .map((m) => generateMessage(m))
    .join("\n\n");

  const serviceTypes = fileContents
    ?.getServiceList()
    .map((s) => generateService(s))
    .join("\n\n");
  return [eslintDisable, imports, messageTypes, serviceTypes].join("\n\n");
};
