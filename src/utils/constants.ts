export const replaceSpecialChars = (
  text: string,
  sendEmptyString?: boolean
) => {
  return text
    ? String(text)
        .trim()
        .replace(/[&\/\\#, +()$~%.'":*?<>{}^\[\]\|]/g, "\\$&")
    : sendEmptyString
    ? ""
    : text;
};
