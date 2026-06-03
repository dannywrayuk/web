import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import dproto from "google-protobuf/google/protobuf/descriptor_pb.js";
import {
  BinaryReader,
  BinaryWriter,
  ExtensionFieldBinaryInfo,
  ExtensionFieldInfo,
} from "google-protobuf";

const binaryReadersByType = {
  8: BinaryReader.prototype.readBool,
  9: BinaryReader.prototype.readString,
};
const binaryWritersByType = {
  8: BinaryWriter.prototype.writeBool,
  9: BinaryWriter.prototype.writeString,
};

export const extensionPass = (request: proto.CodeGeneratorRequest) => {
  request.getProtoFileList().forEach((file) => {
    console.warn("🔌 Registering extensions " + file.getName());
    file.getExtensionList().forEach(registerExtension);
  });
  console.warn("✅ Registered extensions\n");
};

export const registerExtension = (extension: dproto.FieldDescriptorProto) => {
  const name = extension.getName();
  const number = extension.getNumber();
  const typeNum = extension.getType();
  const scope = extension.getExtendee()?.replace(".google.protobuf.", "");

  if (!name || !number || !typeNum) {
    throw new Error("Extension is missing info: " + extension.toObject());
  }
  if (!scope || scope.includes(".")) {
    throw new Error("unhandled extension scope: " + scope);
  }

  // These two defintions are really minimal
  const extensionFieldInfo = new ExtensionFieldInfo(
    number,
    { [name]: 0 },
    // @ts-expect-error test
    null, // not a message type, it's a scalar
    null, // no toObject for scalars
    0, // default value (ignored for strings, but required)
  );

  const reader =
    binaryReadersByType[typeNum as keyof typeof binaryReadersByType];
  const writer =
    binaryWritersByType[typeNum as keyof typeof binaryWritersByType];
  if (!reader || !writer) {
    throw new Error("Unsupported extension type: " + typeNum);
  }

  const extensionFieldBinaryInfo = new ExtensionFieldBinaryInfo(
    extensionFieldInfo,
    reader,
    writer,
    // @ts-expect-error test
    undefined,
    undefined,
    false,
  );

  // This next bit is a little hacky
  if (
    !dproto[scope as keyof typeof dproto]?.extensions ||
    !dproto[scope as keyof typeof dproto]?.extensionsBinary
  ) {
    throw new Error("Unknown extension scope: " + scope);
  }

  dproto[scope as keyof typeof dproto].extensions[number] = extensionFieldInfo;
  dproto[scope as keyof typeof dproto].extensionsBinary[number] =
    extensionFieldBinaryInfo;
};
