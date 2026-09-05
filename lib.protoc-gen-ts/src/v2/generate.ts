import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import proto_d from "google-protobuf/google/protobuf/descriptor_pb.js";
import { asFile } from "./asFile.ts";
import { typeMap } from "./typeMap.ts";

export type ServiceDefinition = {
  serviceName: string;
  config: Record<string, Record<string, unknown>>;
  methods: Record<
    string,
    {
      name: string;
      inputType: string;
      outputType: string;
      options: Record<string, unknown>;
    }
  >;
  messages: Record<
    string,
    {
      name: string;
      fields: Record<
        string,
        { name: string; type: string; options: Record<string, unknown> }
      >;
    }
  >;
  imports: Record<string, string>;
  helpers: Record<string, string | boolean>;
};

const helperMessages: Record<string, boolean> = {
  ".Empty": true,
};

function formatConfig(file: proto_d.FileDescriptorProto) {
  const options = (file.getOptions()?.toObject() || {}) as {
    config: { stage: string; e?: string[] }[] | undefined;
  };
  const config = options.config?.reduce(
    (acc, c) => {
      if (!c.stage) {
        throw new Error("Config stage is required");
      }
      acc[c.stage] = c.e
        ? c.e?.reduce(
            (vars, v) => {
              if (v.includes("[]=")) {
                const [key, value] = v.split("[]=");
                if (!vars[key]) {
                  vars[key] = [];
                }
                (vars[key] as unknown[]).push(value);
              } else if (v.includes("=")) {
                const [key, value] = v.split("=");
                vars[key] = value;
              } else {
                vars[v] = true;
              }
              return vars;
            },
            {} as Record<string, unknown>,
          ) || {}
        : {};
      return acc;
    },
    {} as Record<string, Record<string, unknown>>,
  );
  return config || {};
}

function formatMessageFieldOptions(field: proto_d.FieldDescriptorProto) {
  const options = (field.getOptions()?.toObject() || {}) as Record<
    string,
    unknown
  >;
  return {
    validation: options.validation,
    repeated:
      field.getLabel() === proto_d.FieldDescriptorProto.Label.LABEL_REPEATED ||
      undefined,
  };
}

function formatMethodOptions(method: proto_d.MethodDescriptorProto) {
  const options = (method.getOptions()?.toObject() || {}) as Record<
    string,
    unknown
  >;
  return {
    api: options.api,
    using: options.using,
    secrets: options.secret,
  };
}

export const generate = (request: proto.CodeGeneratorRequest) => {
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

  const services = fileContents?.getServiceList();
  if (services.length !== 1) {
    throw new Error("Expected exactly one service in the proto file");
  }
  const service = services[0];
  const methods = service.getMethodList();
  const messages: Record<string, proto_d.DescriptorProto> = fileContents
    .getMessageTypeList()
    .reduce(
      (acc, message) => {
        const name = message.getName();
        if (!name) {
          throw new Error("Message has no name");
        }
        acc[name] = message;
        return acc;
      },
      {} as Record<string, proto_d.DescriptorProto>,
    );
  function parseNestedMessages([parentName, message]: [
    string,
    proto_d.DescriptorProto,
  ]) {
    const nestedMessages = message.getNestedTypeList();
    nestedMessages.forEach((nestedMessage) => {
      const name = nestedMessage.getName();
      if (!name) {
        throw new Error("Nested message has no name");
      }
      const scopedName = parentName + "." + name;
      messages[scopedName] = nestedMessage;
      parseNestedMessages([scopedName, nestedMessage]);
    });
  }
  Object.entries(messages).forEach(parseNestedMessages);

  const serviceName = service.getName()?.toLowerCase();
  if (!serviceName) {
    throw new Error("Service has no name");
  }

  const serviceDefinition: ServiceDefinition = {
    serviceName: serviceName,
    config: {},
    methods: {},
    messages: {},
    imports: {},
    helpers: {},
  };

  serviceDefinition.config = formatConfig(fileContents);

  methods.forEach((method) => {
    const name = method.getName();
    const inputType = method.getInputType();
    const outputType = method.getOutputType();
    if (!name) {
      throw new Error("Method has no name");
    }
    if (!inputType) {
      throw new Error("Method has no input type");
    }
    if (!outputType) {
      throw new Error("Method has no output type");
    }
    serviceDefinition.methods[name] = {
      name,
      inputType,
      outputType,
      options: formatMethodOptions(method),
    };
  });

  Object.values(serviceDefinition.methods).forEach((method) => {
    addMessage(method.inputType);
    addMessage(method.outputType);
  });

  function addMessage(name: string) {
    if (serviceDefinition.messages[name]) {
      return;
    }
    if (helperMessages[name]) {
      serviceDefinition.helpers[`message${name}`] = true;
      return;
    }
    const message = messages[name.slice(1)];
    if (!message) {
      throw new Error("Message not found: " + name);
    }
    const fields = message.getFieldList();
    const messageDefinition = {
      name,
      fields: {} as Record<
        string,
        { name: string; type: string; options: Record<string, unknown> }
      >,
    };
    fields.forEach((field) => {
      const fieldName = field.getName();
      const fieldTypeName = field.getTypeName();
      const fieldType = field.getType();
      if (!fieldName || !fieldType) {
        throw new Error("Field has no name or type");
      }

      if (fieldTypeName) {
        addMessage(fieldTypeName);
      }

      messageDefinition.fields[fieldName] = {
        name: fieldName,
        type: fieldTypeName || typeMap(fieldType),
        options: formatMessageFieldOptions(field),
      };
    });
    serviceDefinition.messages[name] = messageDefinition;
  }
  // console.warn(JSON.stringify(serviceDefinition, null, 2));
  return asFile(serviceDefinition);
};
