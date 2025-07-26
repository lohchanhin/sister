export const decodeFilename = name =>
  Buffer.from(name, 'latin1').toString('utf8')
