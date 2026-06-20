import proto from "google-protobuf/google/protobuf/descriptor_pb.js";
import { protoNameToTypeName } from "./util.ts";
import { typeMap } from "./typeMap.ts";
import { extensions } from "./registerExtensions.ts";

const typeValidationTemplate = (name: string, validationBlocks: string) => {
  const tsName = protoNameToTypeName(name);
  return `export const validate${tsName} = (
  obj?: Record<string, any>
): Result<${tsName}> => {
  ${validationBlocks.trim() ? validationBlocks : ""}
  return ok(obj as ${tsName});
};`;
};

const fieldBlockTemplate = (
  fieldName: string,
  expected: string,
  check: string,
) => {
  return `if (${check}) {
  return err(null, "validating ${fieldName}, expected ${expected}");
}`;
};

const validateFieldBlock = (field: proto.FieldDescriptorProto) => {
  const name = field.getName();

  if (!name) {
    throw new Error("Field has no name");
  }

  const type = field.getType();

  if (!type) {
    throw new Error("Field has no type");
  }

  const optional = !field
    .getOptions()
    ?.getExtension<string | undefined>(extensions.FieldOptions?.validation)
    ?.split(",")
    .includes("required");

  const repeated =
    field.getLabel() === proto.FieldDescriptorProto.Label.LABEL_REPEATED;

  const messageType = field.getTypeName();
  const typeName = messageType
    ? protoNameToTypeName(messageType)
    : typeMap(type);

  const typeCheck = messageType
    ? `validate${protoNameToTypeName(messageType)}(obj?.${name})[1]`
    : `typeof obj?.${name} !== "${typeName}"`;

  const arrayCheck = `!Array.isArray(obj?.${name}) || obj?.${name}?.some((i) => ${typeCheck.replace(`obj?.${name}`, "i")})`;
  const optionalCheck = `typeof obj?.${name} !== "undefined"`;

  if (repeated) {
    if (optional) {
      return fieldBlockTemplate(
        name,
        "optional " + typeName + "[]",
        "(" + arrayCheck + ") && " + optionalCheck,
      );
    }
    return fieldBlockTemplate(name, typeMap(type) + "[]", arrayCheck);
  }
  if (optional) {
    return fieldBlockTemplate(
      name,
      "optional " + typeName,
      typeCheck + " && " + optionalCheck,
    );
  }
  return fieldBlockTemplate(name, typeName, typeCheck);
};

export const generateTypeValidationFunction = (
  message: proto.DescriptorProto,
  parentName?: string,
) => {
  const name = message.getName();

  if (!name) {
    throw new Error("Message has no name");
  }
  const fullName = parentName ? parentName + "." + name : name;

  const validateFieldBlocks =
    message
      .getFieldList()
      .map((f) => validateFieldBlock(f))
      .join("\n  ") + "\n  ";

  return typeValidationTemplate(fullName, validateFieldBlocks);
};
