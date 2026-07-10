/* eslint-disable @typescript-eslint/no-explicit-any */
import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import dproto from "google-protobuf/google/protobuf/descriptor_pb.js";
import {
  BinaryReader,
  BinaryWriter,
  ExtensionFieldBinaryInfo,
  ExtensionFieldInfo,
  Message,
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

const scalarReaders: Record<number, (this: BinaryReader) => unknown> = {
  5: BinaryReader.prototype.readInt32,
  8: BinaryReader.prototype.readBool,
  9: BinaryReader.prototype.readString,
  13: BinaryReader.prototype.readUint32,
};

const scalarDefaults: Record<number, unknown> = {
  5: 0,
  8: false,
  9: "",
  13: 0,
};

function createDynamicMessageClass(
  descriptor: dproto.DescriptorProto,
): new () => any {
  const fields = descriptor.getFieldList();
  const repeatedFieldNumbers = fields
    .filter(
      (f) => f.getLabel() === dproto.FieldDescriptorProto.Label.LABEL_REPEATED,
    )
    .map((f) => f.getNumber()!);

  // @ts-expect-error dynamic class extending Message
  const DynMsg = class extends Message {
    constructor() {
      super();
      Message.initialize(this, [], 0, -1, repeatedFieldNumbers, null);
    }
  };

  (DynMsg as any).toObject = function (_: boolean, msg: Message) {
    const obj: Record<string, unknown> = {};
    for (const field of fields) {
      const name = field.getName()!;
      const number = field.getNumber()!;
      const isRepeated =
        field.getLabel() === dproto.FieldDescriptorProto.Label.LABEL_REPEATED;
      if (isRepeated) {
        obj[name] = Message.getField(msg, number) || [];
      } else {
        const type = field.getType()!;
        obj[name] = Message.getFieldWithDefault(
          msg,
          number,
          scalarDefaults[type] ?? "",
        );
      }
    }
    return obj;
  };

  (DynMsg as any).deserializeBinaryFromReader = function (
    msg: Message,
    reader: BinaryReader,
  ) {
    while (reader.nextField()) {
      if (reader.isEndGroup()) break;
      const fieldNum = reader.getFieldNumber();
      const field = fields.find((f) => f.getNumber() === fieldNum);
      if (!field) {
        reader.skipField();
        continue;
      }
      const type = field.getType()!;
      const readFn = scalarReaders[type];
      if (!readFn) {
        reader.skipField();
        continue;
      }
      const value = readFn.call(reader);
      const isRepeated =
        field.getLabel() === dproto.FieldDescriptorProto.Label.LABEL_REPEATED;
      if (isRepeated) {
        const arr = Message.getField(msg, fieldNum) as unknown[];
        arr.push(value);
      } else {
        Message.setField(msg, fieldNum, value as any);
      }
    }
    return msg;
  };

  (DynMsg as any).serializeBinaryToWriter = function (
    message: Message,
    writer: BinaryWriter,
  ) {
    for (const field of fields) {
      const number = field.getNumber()!;
      const type = field.getType()!;
      const isRepeated =
        field.getLabel() === dproto.FieldDescriptorProto.Label.LABEL_REPEATED;
      if (isRepeated) {
        const values = Message.getField(message, number) as unknown[];
        if (values && values.length > 0) {
          for (const v of values) {
            (
              binaryWritersByType[type as keyof typeof binaryWritersByType] as (
                this: BinaryWriter,
                field: number,
                value: unknown,
              ) => void
            )?.call(writer, number, v);
          }
        }
      } else {
        const def = scalarDefaults[type] ?? "";
        const value = Message.getFieldWithDefault(message, number, def);
        if (value !== def) {
          (
            binaryWritersByType[type as keyof typeof binaryWritersByType] as (
              this: BinaryWriter,
              field: number,
              value: unknown,
            ) => void
          )?.call(writer, number, value);
        }
      }
    }
  };

  return DynMsg as unknown as new () => any;
}

export const extensionPass = (request: proto.CodeGeneratorRequest) => {
  const messageMap: Record<string, dproto.DescriptorProto> = {};
  request.getProtoFileList().forEach((file) => {
    const pkg = file.getPackage() || "";
    file.getMessageTypeList().forEach((msg) => {
      const name = msg.getName();
      if (name) {
        messageMap[pkg ? `.${pkg}.${name}` : `.${name}`] = msg;
      }
    });
  });

  request.getProtoFileList().forEach((file) => {
    console.warn("🔌 Registering extensions " + file.getName());
    file
      .getExtensionList()
      .forEach((ext) => registerExtension(ext, messageMap));
  });
  console.warn("✅ Registered extensions\n");
};

const resolveMessageType = (typeName: string) => {
  // Strip leading dot, then the google.protobuf prefix (same convention you
  // already use for `scope`). The remainder should be the class name on dproto.
  const cleaned = typeName.replace(/^\./, "").replace("google.protobuf.", "");
  const ctor = dproto[cleaned as keyof typeof dproto];
  return ctor as unknown as (new () => any) | undefined;
};

const registerExtension = (
  extension: dproto.FieldDescriptorProto,
  messageMap: Record<string, dproto.DescriptorProto>,
) => {
  const name = extension.getName();
  const number = extension.getNumber();
  const typeNum = extension.getType();
  const typeName = extension.getTypeName(); // set for message/enum types
  const scope = extension.getExtendee()?.replace(".google.protobuf.", "");
  const repeated =
    extension.getLabel() === dproto.FieldDescriptorProto.Label.LABEL_REPEATED;
  const isMessage = typeNum === dproto.FieldDescriptorProto.Type.TYPE_MESSAGE;
  const isGroup = typeNum === dproto.FieldDescriptorProto.Type.TYPE_GROUP;

  if (!name || !number || !typeNum) {
    throw new Error("Extension is missing info: " + extension.toObject());
  }
  if (!scope || scope.includes(".")) {
    throw new Error("unhandled extension scope: " + scope);
  }
  if (isGroup) {
    throw new Error("Group extensions are not supported: " + name);
  }

  let ctor: (new () => any) | null = null;
  let toObjectFn: (() => object) | null = null;
  let messageSerializeFn: unknown = undefined;
  let messageDeserializeFn: unknown = undefined;

  if (isMessage) {
    if (!typeName) {
      throw new Error("Message extension missing type name: " + name);
    }
    let resolved = resolveMessageType(typeName);
    if (!resolved) {
      const descriptor = messageMap[typeName];
      if (!descriptor) {
        console.warn(
          `Skipping extension ${name}: could not resolve message type ${typeName}`,
        );
        return;
      }
      resolved = createDynamicMessageClass(descriptor);
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
