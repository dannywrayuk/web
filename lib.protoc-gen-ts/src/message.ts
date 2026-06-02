import proto from "google-protobuf/google/protobuf/descriptor_pb.js";
import { typeMap } from "./typeMap.ts";

const typeTemplate = (name: string, fields: string[]) =>
  `export type ${name} = {
  ${fields.join("\n\t")}
};`;

type TypeFieldOptions = {
  array: boolean;
  optional: boolean;
};
const typeFieldTemplate = (
  name: string,
  type: string,
  fieldOptions?: TypeFieldOptions,
) =>
  `\t${name}${fieldOptions?.optional ? "?" : ""}: ${type}${fieldOptions?.array ? "[]" : ""};`;

const generateMessageField = (field: proto.FieldDescriptorProto) => {
  const name = field.getName();
  if (!name) {
    throw new Error("Field has no name");
  }
  const type = field.getType();
  if (!type) {
    throw new Error("Field has no type");
  }
  const validation = field
    .getOptions()
    ?.getExtension<
      string | undefined
    >(proto.FieldOptions.extensionsBinary[51234].fieldInfo)
    ?.split(",");
  const typeOptions = {
    array: field.getLabel() === proto.FieldDescriptorProto.Label.LABEL_REPEATED,
    optional: !validation?.includes("required"),
  };

  if (type === proto.FieldDescriptorProto.Type.TYPE_MESSAGE) {
    const rawTypeName = field.getTypeName();
    if (!rawTypeName) {
      throw new Error("Field has no type name");
    }
    const typeName = (
      rawTypeName?.startsWith(".") ? rawTypeName.slice(1) : rawTypeName
    ).replace(/\./g, "_");
    return typeFieldTemplate(name, typeName, typeOptions);
  }
  return typeFieldTemplate(name, typeMap(type), typeOptions);
};

export const generateMessage = (message: proto.DescriptorProto) => {
  const name = message.getName();
  if (!name) {
    throw new Error("Message has no name");
  }
  const fields = message.getFieldList().map(generateMessageField);
  return typeTemplate(name, fields);
};
