export const validateText = (value: string | String) => {
  if (typeof value === "string" || value instanceof String) return value.trim();
  else return null;
};

export const isUser = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value
      .map((it) => {
        it = validateText(it) as string;
        if (it) it = it.toLowerCase();
        return it;
      })
      .filter((it) => !!it);
  } else if (validateText(value as string)) {
    return validateText(value as string)?.toLowerCase();
  }

  return null;
};

export const isText = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value
      .map((it) => {
        it = validateText(it) as string;

        return it;
      })
      .filter((it) => !!it);
  } else if (validateText(value as string)) {
    return validateText(value as string);
  }

  return null;
};

export const validateNumber = (n: string) => {
  return !isNaN(parseFloat(n)) && !isNaN((n as any) - 0);
};

export const validateDate = (d: string) => {
  var timestamp = Date.parse(d);

  if (isNaN(timestamp) == false) {
    return d;
  }
  return null;
};
export const isNumber = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value
      .map((it) => {
        return validateNumber(it) ? Number(it) : null;
      })
      .filter((it) => !!it) as Number[];
  } else if (validateNumber(value)) {
    return validateNumber(value) ? Number(value) : null;
  }

  return null;
};

export const isDate = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value
      .map((it) => {
        return validateDate(it);
      })
      .filter((it) => !!it) as string[];
  } else if (validateDate(value as string)) {
    return validateDate(value as string);
  }

  return null;
};

export const isImage = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value
      .map((it) => {
        it = isValidHttpUrl(it) as string;
        // if (it) it = it.toLowerCase();
        return it;
      })
      .filter((it) => !!it);
  } else if (validateText(value as string)) {
    return isValidHttpUrl(value as string);
  }

  return null;
};

export const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const isEmail = (value: string | string[]) => {
  if (Array.isArray(value)) {
    return value
      .map((it) => {
        let it1 = validateEmail(it)?.length ? it : null;
        // if (it) it = it.toLowerCase();
        return it1;
      })
      .filter((it) => !!it) as string[];
  } else if (validateText(value as string)) {
    return validateEmail(value as string)?.length ? value : null;
  }

  return null;
};
export const isValidHttpUrl = (string: string) => {
  let url;

  try {
    url = new URL(validateText(string as string) as string);
  } catch (_) {
    return null;
  }

  return url.protocol === "http:" || url.protocol === "https:"
    ? url.toString()
    : null;
};
