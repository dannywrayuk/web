export const exportName = ({
  stackName,
  referenceName,
  type,
}: {
  stackName: string;
  referenceName: string;
  type: string;
}) => {
  return `Stack:${stackName}:Type:${type}:Ref:${referenceName}`;
};
