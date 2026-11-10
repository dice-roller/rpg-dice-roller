import {
  customDieFaces,
  customDieRange,
  formatCustomDieNumber,
  MAX_CUSTOM_DIE_FACES,
} from "../../src/dice/custom-die-notation.js";
import { ValidationError } from "../../src/errors/ValidationError.js";

describe("customDieFaces", () => {
  test("keeps face order, duplicates and a single face", () => {
    expect(customDieFaces([2, 1, 1])).toEqual([2, 1, 1]);
    expect(customDieFaces(["2", "1", "1"])).toEqual([2, 1, 1]);
    expect(customDieFaces([5])).toEqual([5]);
  });

  test("allows exactly the notation face limit", () => {
    expect(
      customDieFaces(Array.from({ length: MAX_CUSTOM_DIE_FACES }, (_, i) => i)),
    ).toHaveLength(MAX_CUSTOM_DIE_FACES);
  });

  test.each([
    ["an empty list", []],
    ["a non-finite face", [1, Number.NaN]],
    ["an infinite face", [Number.POSITIVE_INFINITY]],
    ["a list over the notation limit", Array(MAX_CUSTOM_DIE_FACES + 1).fill(1)],
  ])("rejects %s", (_, faces) => {
    expect(() => customDieFaces(faces)).toThrow(ValidationError);
  });
});

describe("customDieRange", () => {
  test.each<
    [
      string,
      string,
      string,
      string | undefined,
      ReturnType<typeof customDieRange>,
    ]
  >([
    [
      "compact implicit integer range",
      "1",
      "6",
      undefined,
      { kind: "range", start: 1, end: 6 },
    ],
    [
      "fractional implicit step",
      "1.5",
      "3.5",
      undefined,
      { kind: "faces", faces: [1.5, 2.5, 3.5] },
    ],
    [
      "fractional explicit step",
      "1.5",
      "4",
      "1",
      { kind: "faces", faces: [1.5, 2.5, 3.5] },
    ],
    [
      "tenths reach the endpoint",
      "0",
      "0.3",
      "0.1",
      { kind: "faces", faces: [0, 0.1, 0.2, 0.3] },
    ],
    [
      "four decimal places",
      "0",
      "0.0003",
      "0.0001",
      { kind: "faces", faces: [0, 0.0001, 0.0002, 0.0003] },
    ],
    [
      "insignificant trailing fractional zeros",
      "0",
      "0.0003",
      "0.00010000",
      { kind: "faces", faces: [0, 0.0001, 0.0002, 0.0003] },
    ],
    [
      "arithmetic across zero",
      "-0.0002",
      "0.0002",
      "0.0001",
      { kind: "faces", faces: [-0.0002, -0.0001, 0, 0.0001, 0.0002] },
    ],
    [
      "negative bounds and positive step",
      "-2",
      "0",
      "0.5",
      { kind: "faces", faces: [-2, -1.5, -1, -0.5, 0] },
    ],
    [
      "descending explicit step",
      "8",
      "4",
      "-2",
      { kind: "faces", faces: [8, 6, 4] },
    ],
    [
      "unreachable endpoint is not appended",
      "4",
      "8",
      "3",
      { kind: "faces", faces: [4, 7] },
    ],
    [
      "equal implicit integer bounds",
      "4",
      "4",
      undefined,
      { kind: "range", start: 4, end: 4 },
    ],
    ["equal explicit bounds", "4", "4", "-2", { kind: "faces", faces: [4] }],
    [
      "safe integer range remains compact above the cap",
      "1",
      "1001",
      undefined,
      { kind: "range", start: 1, end: 1001 },
    ],
    [
      "compact integer bounds remain exempt from the expanded magnitude limit",
      "450359962738",
      "450359962738",
      undefined,
      { kind: "range", start: 450359962738, end: 450359962738 },
    ],
    [
      "maximum expanded bound with a four-place step",
      "450359962737.0494",
      "450359962737.0495",
      "0.0001",
      { kind: "faces", faces: [450359962737.0494, 450359962737.0495] },
    ],
    [
      "maximum positive step magnitude",
      "0",
      "0",
      "450359962737.0495",
      { kind: "faces", faces: [0] },
    ],
    [
      "maximum negative step magnitude",
      "0",
      "0",
      "-450359962737.0495",
      { kind: "faces", faces: [0] },
    ],
    [
      "minimum expanded bound",
      "-450359962737.0495",
      "-450359962737.0495",
      undefined,
      { kind: "faces", faces: [-450359962737.0495] },
    ],
    [
      "decimal notation is normalized before scaling",
      "1.50",
      "2",
      "0.25",
      { kind: "faces", faces: [1.5, 1.75, 2] },
    ],
  ])("%s", (_, start, end, step, expected) => {
    expect(customDieRange(start, end, step)).toEqual(expected);
  });

  test("allows exactly the face limit for an expanded sequence", () => {
    expect(customDieRange("0", "999", "1")).toEqual({
      kind: "faces",
      faces: Array.from({ length: MAX_CUSTOM_DIE_FACES }, (_, index) => index),
    });
  });

  test("formats exponent-form values as bounded decimal literals", () => {
    expect(formatCustomDieNumber(1e-7)).toBe("0.0000001");
    expect(formatCustomDieNumber(1e21)).toBe("1000000000000000000000");
    expect(Number(formatCustomDieNumber(Number.MIN_VALUE))).toBe(
      Number.MIN_VALUE,
    );
    expect(Number(formatCustomDieNumber(Number.MAX_VALUE))).toBe(
      Number.MAX_VALUE,
    );
  });

  test.each([
    ["zero step", "0", "2", "0"],
    ["positive step away from a lower end", "4", "1", "1"],
    ["negative step away from a higher end", "1", "4", "-1"],
    ["sequence larger than the cap", "0", "1000", "1"],
    ["a fifth significant fractional place", "0", "0.00003", "0.00001"],
    [
      "positive bound above the expanded magnitude limit",
      "450359962737.0496",
      "450359962737.0496",
      undefined,
    ],
    [
      "negative bound below the expanded magnitude limit",
      "-450359962737.0496",
      "-450359962737.0496",
      undefined,
    ],
    ["step above the expanded magnitude limit", "0", "0", "450359962737.0496"],
    ["invalid start token", "1e2", "4", undefined],
    ["invalid step token", "0", "1", "nope"],
    ["non-finite bound", "9".repeat(309), "10", undefined],
    ["an excessive token length", "0".repeat(1025), "1", undefined],
    [
      "fractional precision beyond four places",
      "0",
      "1",
      `0.${"0".repeat(4)}1`,
    ],
  ])("rejects %s", (_, start, end, step) => {
    expect(() => customDieRange(start, end, step)).toThrow(ValidationError);
  });
});

describe("formatCustomDieNumber", () => {
  test.each([
    1e-7,
    1e21,
    Number.MIN_VALUE,
    -Number.MIN_VALUE,
    Number.MAX_VALUE,
    -1.25,
  ])(
    "%p formats as a decimal literal without changing its number value",
    (value) => {
      const notation = formatCustomDieNumber(value);

      expect(notation).not.toMatch(/[eE][+-]?\d/);
      expect(Number(notation)).toBe(value);
    },
  );
});
