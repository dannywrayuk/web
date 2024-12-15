export const workflow = function () {
  const flow = [] as any;

  return {
    flow,
    step(x: any) {
      flow.push(x?.flow?.flat() || x);
      return this;
    },
    if(x: any) {
      const trueFlow = [] as any;
      const falseFlow = [] as any;
      flow.push({ condition: x?.flow?.flat() || x, trueFlow, falseFlow });
      return {
        ...this,
        then(x: any) {
          trueFlow.push(x?.flow?.flat() || x);
          return this;
        },
        else(x: any) {
          falseFlow.push(x?.flow?.flat() || x);
          return this;
        },
      };
    },
    run(engine: any) {
      console.log("\nRunning engine:");
      engine(flow);
    },
  };
};

export const engine = (flow: any, acc: any = []) => {
  // console.log(flow, "\n");
  if (Array.isArray(flow)) {
    return flow.map((step) => engine(step, acc));
  }
  if (typeof flow === "object") {
    if ("condition" in flow) {
      const condition = engine(flow.condition, acc);
      if (condition) {
        return engine(flow.trueFlow, acc);
      }
      return engine(flow.falseFlow, acc);
    }
    if ("step" in flow) {
      const output = flow.step(acc);
      acc.push(output);
      return output;
    }
  }
  if (typeof flow === "function") {
    const output = flow(acc);
    acc.push(output);
    return output;
  }
  acc.push(flow);
  return flow;
};
