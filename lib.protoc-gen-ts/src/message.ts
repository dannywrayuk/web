import proto from "google-protobuf/google/protobuf/descriptor_pb.js";
import { typeMap } from "./typeMap.ts";
import { extensions } from "./registerExtensions.ts";
import { protoNameToTypeName } from "./util.ts";
import { generateTypeValidationFunction } from "./typeValidationFunction.ts";

const typeTemplate = (name: string, fields: string[]) => {
  const tsName = protoNameToTypeName(name);
  if (fields.length === 0) {
    return `export type ${tsName} = Record<string, never>;`;
  }
  const tsFields = fields.join("\n  ");
  return `export type ${tsName} = {
  ${tsFields}
};`;
};

type TypeFieldOptions = {
  array: boolean;
  optional: boolean;
};
const typeFieldTemplate = (
  name: string,
  type: string,
  fieldOptions?: TypeFieldOptions,
) => {
  const optional = fieldOptions?.optional ? "?" : "";
  const array = fieldOptions?.array ? "[]" : "";
  const tsTypeName = protoNameToTypeName(type);
  return `${name}${optional}: ${tsTypeName}${array};`;
};

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
    ?.getExtension<string | undefined>(extensions.FieldOptions?.validation)
    ?.split(",");
  const typeOptions = {
    array: field.getLabel() === proto.FieldDescriptorProto.Label.LABEL_REPEATED,
    optional: !validation?.includes("required"),
  };

  if (type === proto.FieldDescriptorProto.Type.TYPE_MESSAGE) {
    const typeName = field.getTypeName();
    if (!typeName) {
      throw new Error("Field has no type name");
    }
    return typeFieldTemplate(name, typeName, typeOptions);
  }
  return typeFieldTemplate(name, typeMap(type), typeOptions);
};

export const generateMessage = (
  message: proto.DescriptorProto,
  parentName?: string,
): string => {
  const name = message.getName();
  if (!name) {
    throw new Error("Message has no name");
  }
  const fullName = parentName ? parentName + "." + name : name;
  const nestedTypes = message
    .getNestedTypeList()
    .map((m) => generateMessage(m, fullName));
  const fields = message.getFieldList().map(generateMessageField);
  const validationFunction = generateTypeValidationFunction(
    message,
    parentName,
  );
  return (
    (nestedTypes.length ? nestedTypes.join("\n\n") + "\n\n" : "") +
    typeTemplate(fullName, fields) +
    "\n\n" +
    validationFunction
  );
};
