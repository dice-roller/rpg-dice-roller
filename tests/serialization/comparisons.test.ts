import {
  binary,
  comparison,
  conditionReference,
  conditional,
  pool,
} from "../../src/ast/builders.js";
import { COMPARE_OPERATORS } from "../../src/ast/nodes.js";
import { ImportError } from "../../src/errors/ImportError.js";
import { Roll } from "../../src/Roll.js";
import { Roller } from "../../src/Roller.js";
import { RollSettings } from "../../src/RollSettings.js";
import { toBase64 } from "../../src/serialization/encode.js";
import { EXPORT_FORMATS } from "../../src/serialization/formats.js";
import type { EncodedRollData } from "../../src/serialization/formats.js";

const DELETE = Symbol("delete");
const reference = {
  type: "reference",
  namespace: "system",
  path: ["condition"],
};
const referenceResult = {
  type: "reference",
  node: reference,
  value: 1,
};

function corrupt(path: string, value: unknown): EncodedRollData {
  const data = JSON.parse(
    new Roll(comparison("<", 1, 2)).export("json"),
  ) as Record<string, unknown>;
  const keys = path.split(".");
  const last = keys.pop()!;
  let parent = data;
  for (const key of keys) parent = parent[key] as Record<string, unknown>;
  if (value === DELETE) delete parent[last];
  else parent[last] = value;
  return data as unknown as EncodedRollData;
}

describe("comparison serialization", () => {
  test.each(EXPORT_FORMATS)(
    "rolls and histories round-trip through %s without evaluating or drawing",
    (format) => {
      const roller = new Roller({ engine: { name: "mersenne", seed: 1 } });
      const originals = [
        ...COMPARE_OPERATORS.map((op) => roller.roll(comparison(op, 1, 2))),
        roller.roll(comparison(">", pool(2, 6), pool(1, 6))),
        roller.roll(comparison("=", comparison("<", 1, 2), 1)),
        roller.roll(
          conditional(2, comparison(">", conditionReference(), 1), 0),
        ),
        roller.roll(
          conditional(2, comparison("<", 1, conditionReference()), 0),
        ),
        roller.roll(conditional(comparison("<", 1, 2), 3, 4)),
      ];
      const importedRoller = new Roller();
      const integer = jest.spyOn(importedRoller.generator, "integer");
      const evaluate = jest.spyOn(importedRoller.settings, "evaluate");
      const imported = importedRoller.import(roller.export(format));

      expect(imported.map((roll) => roll.result)).toEqual(
        originals.map((roll) => roll.result),
      );
      expect(importedRoller.export("object")).toEqual(roller.export("object"));
      expect(integer).not.toHaveBeenCalled();
      expect(evaluate).not.toHaveBeenCalled();

      for (const original of originals) {
        const settings = new RollSettings();
        const draw = jest.spyOn(settings.generator, "integer");
        const evaluateRoll = jest.spyOn(settings, "evaluate");
        const copy = Roll.import(original.export(format), settings);
        expect(copy.export("object")).toEqual(original.export("object"));
        expect(draw).not.toHaveBeenCalled();
        expect(evaluateRoll).not.toHaveBeenCalled();
      }
    },
  );

  test.each(EXPORT_FORMATS)(
    "rerolls both restored operands through %s",
    (format) => {
      const originalSettings = new RollSettings();
      const originalDraws = [5, 2];
      jest
        .spyOn(originalSettings.generator, "integer")
        .mockImplementation(() => originalDraws.shift() ?? 1);
      const original = new Roll(
        comparison(">", pool(1, 6), pool(1, 6)),
        originalSettings,
      );
      const settings = new RollSettings();
      const draws = [1, 6];
      const integer = jest
        .spyOn(settings.generator, "integer")
        .mockImplementation(() => draws.shift() ?? 1);
      const imported = Roll.import(original.export(format), settings);

      expect(imported.result).toMatchObject({
        value: 1,
        left: { value: 5 },
        right: { value: 2 },
      });
      expect(integer).not.toHaveBeenCalled();
      expect(imported.reroll().result).toMatchObject({
        value: 0,
        left: { value: 1 },
        right: { value: 6 },
      });
      expect(integer).toHaveBeenCalledTimes(2);
    },
  );

  test.each(EXPORT_FORMATS)(
    "preserves non-finite operand snapshots through %s",
    (format) => {
      const original = new Roll(
        comparison("=", binary("/", 1, 0), binary("/", -1, 0)),
      );
      const imported = Roll.import(original.export(format));
      expect(imported.result).toEqual(original.result);
      expect(imported.result).toMatchObject({
        left: { value: Infinity },
        right: { value: -Infinity },
      });
    },
  );

  test("preserves a stored NaN operand snapshot in every format", () => {
    const data = corrupt("result.left.value", { $number: "NaN" });
    const json = JSON.stringify(data);
    for (const input of [data, json, toBase64(json)]) {
      expect(Roll.import(input).result).toMatchObject({ left: { value: NaN } });
    }
  });

  test("preserves inconsistent stored snapshots and previous version-1 data", () => {
    const data = corrupt("result.value", 42);
    const imported = Roll.import(data);
    expect(imported.result).toMatchObject({
      value: 42,
      left: { value: 1 },
      right: { value: 2 },
    });
    expect(imported.export("object")).toEqual(data);
    const previous = new Roll(binary("+", 1, 2)).export("object");
    expect(previous.version).toBe(1);
    expect(Roll.import(previous).export("object")).toEqual(previous);
  });

  test.each<[string, unknown]>([
    ["result.node.op", "=="],
    ["result.node.op", DELETE],
    ["result.node.left", DELETE],
    ["result.node.right", null],
    ["result.left", DELETE],
    ["result.right", null],
    ["result.left.node", { type: "pool" }],
    ["result.right.value", "2"],
    ["result.node.left.value", { $number: "Infinity" }],
    ["result.left.node.value", { $number: "NaN" }],
  ])(
    "rejects malformed or out-of-scope data at %s in every format",
    (path, value) => {
      const data = corrupt(path, value);
      const json = JSON.stringify(data);
      for (const input of [data, json, toBase64(json)]) {
        expect(() => Roll.import(input)).toThrow(ImportError);
        expect(() => Roll.import(input)).toThrow(`data.${path}`);
      }
    },
  );

  test.each<[string, unknown]>([
    ["result.node.left", reference],
    ["result.node.right", reference],
    ["result.left", referenceResult],
    ["result.right", referenceResult],
  ])("imports references without requiring bindings at %s", (path, value) => {
    const data = corrupt(path, value);
    expect(Roll.import(data).export("object")).toEqual(data);
  });

  test("invalid comparison data leaves history unchanged", () => {
    const roller = new Roller();
    roller.roll("1");
    const history = {
      type: "history" as const,
      version: 1 as const,
      rolls: [
        new Roll(binary("+", 1, 2)).export("object"),
        corrupt("result.right", DELETE),
      ],
      total: 0,
    };
    expect(() => roller.import(history)).toThrow(ImportError);
    expect(roller.history).toHaveLength(1);
  });
});
