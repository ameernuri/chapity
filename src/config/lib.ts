export const formatKey = (str: string) =>
  str
    .trim()
    .toUpperCase()
    .replaceAll(/[^a-zA-Z\d]+/g, ' ')
    .trim()
    .replaceAll(/[\s]+/g, '_')
