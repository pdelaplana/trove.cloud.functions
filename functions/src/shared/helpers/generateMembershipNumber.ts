export const generateMembershipNumber = (
  length: number = 6,
  existingValuesSet?: Set<string>
): string => {
  let uniqueNumber: string;
  do {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    uniqueNumber = Math.floor(min + Math.random() * (max - min + 1)).toString();
  } while (existingValuesSet?.has(uniqueNumber));
  return uniqueNumber;
};
