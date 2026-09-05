type Options = {
  useLiterals?: { string?: boolean; number?: boolean; boolean?: boolean };
  humanReadable?: boolean;
  indentChar?: string;
};

export const variableToTypeString = (
  thing: unknown,
  opts?: Options,
): string => {
  if (thing === null) {
    return "null";
  }

  const indent = opts?.humanReadable
    ? (str: string, char = opts.indentChar || "  ") =>
        str.replace(/\n/g, "\n" + char)
    : (str: string) => str;
  const nl = opts?.humanReadable ? "\n" : "";
  const sp = opts?.humanReadable ? " " : "";
  const pipe = opts?.humanReadable ? " | " : "|";

  if (Array.isArray(thing)) {
    if (thing.length === 0) {
      return "[]";
    }

    const typeUnion = Array.from(
      new Set(thing.map((x) => variableToTypeString(x, opts))),
    );

    if (
      opts?.humanReadable &&
      (typeUnion.length > 3 || typeUnion.some((x) => x.includes("\n")))
    ) {
      const types = typeUnion.map((t) => `| ${indent(t, "  ")}`).join("\n");
      return indent(`(\n${types}`) + `\n)[]`;
    }
    return `(${typeUnion.join(pipe)})[]`;
  }

  switch (typeof thing) {
    case "function":
      return "(...args: any) => any"; // Needs to be improved
    case "string":
      return opts?.useLiterals?.string ? `"${thing}"` : "string";
    case "number":
      return opts?.useLiterals?.number ? thing.toString() : "number";
    case "boolean":
      return opts?.useLiterals?.boolean
        ? thing
          ? "true"
          : "false"
        : "boolean";
    case "object": {
      const entries = Object.entries(thing);

      if (entries.length === 0) {
        return "{}";
      }

      return (
        "{" +
        indent(
          entries
            .map(
              ([key, value]) =>
                `${nl}${key}:${sp}${variableToTypeString(value, opts)};`,
            )
            .join(""),
        ) +
        `${nl}}`
      );
    }
    default:
      return typeof thing;
  }
};
