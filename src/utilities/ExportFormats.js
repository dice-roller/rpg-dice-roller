/**
 * Allowed formats for exporting dice data
 *
 * @readonly
 *
 * @type {Readonly<{BASE_64: number, JSON: number, OBJECT: number}>}
 *
 * @property {number} BASE_64
 * @property {number} JSON
 * @property {number} OBJECT
 */
const exportFormats = Object.freeze({
  BASE_64: 1,
  JSON: 0,
  OBJECT: 2,
});

export default exportFormats;
