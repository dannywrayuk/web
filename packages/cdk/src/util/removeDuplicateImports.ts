export const removeDuplicateImports = (code: string): string => {
  const processedCode = code.split("\n").reduce(
    (acc, line) => {
      if (line.trim().startsWith("import")) {
        acc.imports.add(line);
      } else {
        acc.lines.push(line);
      }
      return acc;
    },
    { imports: new Set<string>(), lines: [] as string[] },
  );
  return `${Array.from(processedCode.imports).join("\n")}

${processedCode.lines.join("\n")}`;
};
