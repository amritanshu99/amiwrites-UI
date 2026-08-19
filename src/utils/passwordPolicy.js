export const MIN_PASSWORD_CHARACTERS = 10;
export const MAX_PASSWORD_BYTES = 72;

export function getUtf8ByteLength(value = "") {
  if (typeof value !== "string") return 0;

  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    if (codeUnit <= 0x7f) {
      bytes += 1;
    } else if (codeUnit <= 0x7ff) {
      bytes += 2;
    } else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }

  return bytes;
}

export const passwordMeetsLengthPolicy = (password) =>
  typeof password === "string" &&
  password.length >= MIN_PASSWORD_CHARACTERS &&
  getUtf8ByteLength(password) <= MAX_PASSWORD_BYTES;
