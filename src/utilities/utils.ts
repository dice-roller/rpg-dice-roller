/**
 * Check if the value is a valid base64 encoded string.
 *
 * @param {string} val
 *
 * @returns {boolean} `true` if it is valid base64 encoded, `false` otherwise
 */
const isBase64 = (val: string): boolean => {
  try {
    return !!(val && (btoa(atob(val)) === val));
  } catch (e) {
    return false;
  }
};

/**
 * Check if the value is a valid JSON encoded string.
 *
 * @param {string} val
 *
 * @returns {boolean} `true` if the value is valid JSON, `false` otherwise
 */
const isJson = (val: string): boolean => {
  try {
    const parsed = val ? JSON.parse(val) : false;

    return !!(parsed && (typeof parsed === 'object'));
  } catch (e) {
    return false;
  }
};

export {
  isBase64,
  isJson,
};
