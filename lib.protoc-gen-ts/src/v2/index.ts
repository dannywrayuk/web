import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import * as fs from "fs";
import { generate } from "./generate.ts";
import { extensionPass } from "./registerExtensions.ts";

const main = async (request: proto.CodeGeneratorRequest) => {
  const response = new proto.CodeGeneratorResponse();

  const service = generate(request);
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
  extensionPass(proto.CodeGeneratorRequest.deserializeBinary(input));

  const request = proto.CodeGeneratorRequest.deserializeBinary(input);
  const output = await main(request);
  process.stdout.write(Buffer.from(output.serializeBinary().buffer));
  console.warn("✅ Done.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
