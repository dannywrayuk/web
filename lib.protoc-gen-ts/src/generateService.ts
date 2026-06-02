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

  console.warn("🛠  Generating " + fileName);
  console.warn("💌 Generating message types");
  const messageTypes = fileContents
    ?.getMessageTypeList()
    .map(generateMessage)
    .join("\n\n");

  return [messageTypes].join("\n");
};

// const genFiles = request.getFileToGenerateList();
// console.error(
//   request
//     .getProtoFileList()
//     .map((f) => {
//       const name = f.getName();
//       if (genFiles.includes(name)) {
//         return (
//           name +
//           ": \n" +
//           f
//             .getMessageTypeList()
//             .map(
//               (m) =>
//                 "  " +
//                 m.getName() +
//                 ": " +
//                 m
//                   .getFieldList()
//                   .map(
//                     (e) =>
//                       e.getName() +
//                       "(" +
//                       (typemap[e.getType()] !== "object"
//                         ? typemap[e.getType()]
//                         : e.getTypeName()) +
//                       ")",
//                   )
//                   .join(),
//             )
//             .join("\n")
//         );
//       }
//       return null;
//     })
//     .filter(Boolean)
//     .join("\n"),
// );
