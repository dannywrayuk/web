import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import { generateMessage } from "./message.ts";

export const generateService = (request: proto.CodeGeneratorRequest) => {
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
    .map(generateMessage)
    .join("\n\n");

  return [messageTypes].join("\n");
};
