import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import dproto from "google-protobuf/google/protobuf/descriptor_pb.js";
import {
  BinaryReader,
  BinaryWriter,
  ExtensionFieldBinaryInfo,
  ExtensionFieldInfo,
} from "google-protobuf";

export const extensions: Record<
  "FieldOptions" | "MessageOptions" | "MethodOptions" | "ServiceOptions",
  Record<string, ExtensionFieldInfo<unknown>>
> = {
  FieldOptions: {},
  MessageOptions: {},
  MethodOptions: {},
  ServiceOptions: {},
};

const binaryReadersByType = {
  8: BinaryReader.prototype.readBool,
  9: BinaryReader.prototype.readString,
  11: BinaryReader.prototype.readBytes,
};
const binaryWritersByType = {
  8: BinaryWriter.prototype.writeBool,
  9: BinaryWriter.prototype.writeString,
  11: BinaryWriter.prototype.writeBytes,
};

export const extensionPass = (request: proto.CodeGeneratorRequest) => {
  request.getProtoFileList().forEach((file) => {
    console.warn("🔌 Registering extensions " + file.getName());
    file.getExtensionList().forEach(registerExtension);
  });
  console.warn("✅ Registered extensions\n");
};

// Maps a fully-qualified protobuf type name (e.g. ".google.protobuf.FeatureSet"
// or ".mypkg.MyOptions") to its generated JS message constructor.
// ADJUST THIS to match how your generated code exposes message classes.
const resolveMessageType = (typeName: string) => {
  // Strip leading dot, then the google.protobuf prefix (same convention you
  // already use for `scope`). The remainder should be the class name on dproto.
  const cleaned = typeName.replace(/^\./, "").replace("google.protobuf.", "");
  const ctor = dproto[cleaned as keyof typeof dproto];
  return ctor as unknown as (new () => any) | undefined;
};

const registerExtension = (extension: dproto.FieldDescriptorProto) => {
  const name = extension.getName();
  const number = extension.getNumber();
  const typeNum = extension.getType();
  const typeName = extension.getTypeName(); // set for message/enum types
  const scope = extension.getExtendee()?.replace(".google.protobuf.", "");
  const repeated =
    extension.getLabel() === dproto.FieldDescriptorProto.Label.LABEL_REPEATED;
  const isMessage = typeNum === dproto.FieldDescriptorProto.Type.TYPE_MESSAGE;
  const isGroup = typeNum === dproto.FieldDescriptorProto.Type.TYPE_GROUP;

  console.warn(
    `Registering extension ${name} (number: ${number}, type: ${repeated ? "repeated" : ""}  ${typeNum}${isMessage ? ` -> ${typeName}` : ""}) for scope ${scope}`,
  );

  // NOTE: `!number`/`!typeNum` reject 0, but neither field numbers nor TYPE_*
  // enum values are ever 0, so this is safe.
  if (!name || !number || !typeNum) {
    throw new Error("Extension is missing info: " + extension.toObject());
  }
  if (!scope || scope.includes(".")) {
    throw new Error("unhandled extension scope: " + scope);
  }
  // Groups use a deprecated wire format that jspb's extension machinery does
  // not support via a simple reader/writer pair. Reject them explicitly.
  if (isGroup) {
    throw new Error("Group extensions are not supported: " + name);
  }

  // -- Resolve the message constructor for message-typed extensions ---------
  let ctor: (new () => any) | null = null;
  let toObjectFn: (() => object) | null = null;
  let messageSerializeFn: unknown = undefined;
  let messageDeserializeFn: unknown = undefined;

  if (isMessage) {
    if (!typeName) {
      throw new Error("Message extension missing type name: " + name);
    }
    const resolved = resolveMessageType(typeName);
    if (!resolved) {
      throw new Error("Could not resolve message type: " + typeName);
    }
    ctor = resolved;
    // These live as statics on the generated message class.
    toObjectFn = (resolved as any).toObject;
    messageSerializeFn = (resolved as any).serializeBinaryToWriter;
    messageDeserializeFn = (resolved as any).deserializeBinaryFromReader;

    if (!messageSerializeFn || !messageDeserializeFn) {
      throw new Error(
        "Message type generated without binary support: " + typeName,
      );
    }
  }

  const extensionFieldInfo = new ExtensionFieldInfo(
    number,
    { [name]: 0 },
    // @ts-expect-error test
    ctor, // message constructor, or null for scalars
    toObjectFn, // message .toObject, or null for scalars
    repeated ? 1 : 0, // isRepeated
  );

  // -- Pick the reader/writer -----------------------------------------------
  // For messages, jspb always uses readMessage + write(Repeated)Message, which
  // take a serialize/deserialize callback. For scalars, use the per-type maps.
  let reader: unknown;
  let writer: unknown;

  if (isMessage) {
    reader = BinaryReader.prototype.readMessage;
    writer = repeated
      ? BinaryWriter.prototype.writeRepeatedMessage
      : BinaryWriter.prototype.writeMessage;
  } else {
    reader = binaryReadersByType[typeNum as keyof typeof binaryReadersByType];
    writer = binaryWritersByType[typeNum as keyof typeof binaryWritersByType];
    if (!reader || !writer) {
      throw new Error("Unsupported extension type: " + typeNum);
    }
  }

  // Messages are never packed. Scalars: pass false to use the unpacked
  // (per-element) read path, which matches singular reader/writer functions.
  const isPacked = false;

  const extensionFieldBinaryInfo = new ExtensionFieldBinaryInfo(
    extensionFieldInfo,
    // @ts-expect-error test
    reader,
    writer,
    messageSerializeFn, // binaryMessageSerializeFn (undefined for scalars)
    messageDeserializeFn, // binaryMessageDeserializeFn (undefined for scalars)
    isPacked,
  );

  // This next bit is a little hacky
  if (
    !dproto[scope as keyof typeof dproto]?.extensions ||
    !dproto[scope as keyof typeof dproto]?.extensionsBinary
  ) {
    throw new Error("Unknown extension scope: " + scope);
  }
  extensions[scope as keyof typeof extensions][name] = extensionFieldInfo;
  dproto[scope as keyof typeof dproto].extensions[number] = extensionFieldInfo;
  dproto[scope as keyof typeof dproto].extensionsBinary[number] =
    extensionFieldBinaryInfo;
};
