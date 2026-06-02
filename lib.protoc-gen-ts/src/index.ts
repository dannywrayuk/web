import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import descriptorPb from "google-protobuf/google/protobuf/descriptor_pb.js";
import * as fs from "fs";
import { generateService } from "./generateService.ts";
import {
  BinaryReader,
  BinaryWriter,
  ExtensionFieldBinaryInfo,
  ExtensionFieldInfo,
} from "google-protobuf";

// 1. Define the extension info
const validationExtension = new ExtensionFieldInfo(
  51234,
  { validation: 0 },
  // @ts-expect-error test
  null, // not a message type, it's a scalar
  null, // no toObject for scalars
  0, // default value (ignored for strings, but required)
);

// 2. Register in extensionsBinary so deserialization picks it up
descriptorPb.FieldOptions.extensionsBinary[51234] =
  new ExtensionFieldBinaryInfo(
    validationExtension,
    BinaryReader.prototype.readString,
    BinaryWriter.prototype.writeString,
    // @ts-expect-error test
    undefined,
    undefined,
    false,
  );

const main = async (request: proto.CodeGeneratorRequest) => {
  const response = new proto.CodeGeneratorResponse();

  const service = generateService(request);
  if (!service) {
    return response;
  }

  const file = new proto.CodeGeneratorResponse.File();
  file.setName("/generated/service.ts");
  file.setContent(service);
  response.addFile(file);

  return response;
};

(async () => {
  const input = fs.readFileSync(0);
  const output = await main(
    proto.CodeGeneratorRequest.deserializeBinary(input),
  );
  process.stdout.write(Buffer.from(output.serializeBinary().buffer));
  console.warn("✅ Done.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
