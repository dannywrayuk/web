import proto from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import proto_d from "google-protobuf/google/protobuf/descriptor_pb.js";

type ServiceDefinition = {
  serviceName: string;
  config: { stage: string; e?: string[] }[];
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
  helpers: Record<string, string>;
};

function getMethodOptions(method: proto_d.MethodDescriptorProto) {
  const options = method.getOptions();
  if (!options) {
    return {};
  }
  return options.toObject();
}

function getMessageFieldOptions(field: proto_d.FieldDescriptorProto) {
  const options = field.getOptions();
  if (!options) {
    return {};
  }
  return options.toObject();
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
    config: [],
    methods: {},
    messages: {},
    imports: {},
    helpers: {},
  };

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
      options: getMethodOptions(method),
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
        type: fieldTypeName || fieldType.toString(),
        options: getMessageFieldOptions(field),
      };
    });
    serviceDefinition.messages[name] = messageDefinition;
  }
  console.warn(JSON.stringify(serviceDefinition, null, 2));
  // return serviceDefinition;
  return "";
};
