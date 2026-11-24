import {
  compare,
  conditional,
  criticalFailure,
  criticalSuccess,
  max,
  min,
  pool,
  sort,
} from "../../src/ast/builders.js";
import { ImportError } from "../../src/errors/ImportError.js";
import { Roll } from "../../src/Roll.js";
import { Roller } from "../../src/Roller.js";
import { RollSettings } from "../../src/RollSettings.js";
import { toBase64 } from "../../src/serialization/encode.js";
import { EXPORT_FORMATS } from "../../src/serialization/formats.js";
import type { EncodedRollData } from "../../src/serialization/formats.js";

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
const DELETE = Symbol("delete");

function corrupt(
  notation: string,
  path: string,
  value: unknown,
): EncodedRollData {
  const data = JSON.parse(new Roll(notation).export("json")) as Record<
    string,
    unknown
  >;
  const keys = path.split(".");
  const last = keys.pop()!;
  let parent = data;
  for (const key of keys) parent = parent[key] as Record<string, unknown>;
  if (value === DELETE) delete parent[last];
  else parent[last] = value;
  return data as unknown as EncodedRollData;
}

describe("conditional serialization", () => {
  test.each(EXPORT_FORMATS)(
    "rolls and histories round-trip through %s without rolling",
    (format) => {
      const roller = new Roller({ engine: { name: "mersenne", seed: 1 } });
      const notations = [
        "(2) ? ($$condition+3) : (4)",
        "(0) ? (4) : ($$condition+7)",
        "(2) ?: (4)",
        "(0) ?: ($$condition+4)",
        "(2) ? ((($$condition-1) ? ($$condition+10) : (0))+$$condition) : (0)",
        "(2) ? ((0+$$condition)d($$condition+1)) : (0)",
        "(2) ? ({$$condition, floor($$condition)}) : (0)",
      ];
      const originals = notations.map((notation) => roller.roll(notation));
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
        const copy = Roll.import(original.export(format), settings);
        expect(copy.result).toEqual(original.result);
        expect(copy.export("object")).toEqual(original.export("object"));
        expect(draw).not.toHaveBeenCalled();
      }
    },
  );

  test.each(EXPORT_FORMATS)(
    "rerolls restored shorthand checks and selects a fresh branch through %s",
    (format) => {
      const settings = new RollSettings();
      jest.spyOn(settings.generator, "integer").mockReturnValue(3);
      const original = new Roll("(d6=3) ?: (d6)", settings);
      const rerollSettings = new RollSettings();
      const draws = [2, 5];
      const integer = jest
        .spyOn(rerollSettings.generator, "integer")
        .mockImplementation(() => draws.shift() ?? 1);
      const imported = Roll.import(original.export(format), rerollSettings);

      expect(imported.result).toMatchObject({
        node: { trueBranch: null },
        selectedBranch: "true",
        selectedResult: referenceResult,
      });
      expect(integer).not.toHaveBeenCalled();
      expect(imported.reroll().result).toMatchObject({
        selectedBranch: "false",
        condition: { value: 0 },
        selectedResult: { value: 5 },
      });
      expect(integer).toHaveBeenCalledTimes(2);
    },
  );

  test("preserves stored values and branch choices without checking consistency", () => {
    const data = corrupt("(2) ? (3) : (4)", "result.selectedBranch", "false");
    expect(Roll.import(data).result).toMatchObject({
      selectedBranch: "false",
      selectedResult: { value: 3 },
    });
  });

  test.each(EXPORT_FORMATS)(
    "non-finite conditional results round-trip through %s",
    (format) => {
      const original = new Roll("(1/0) ? ($$condition) : (0)");
      const imported = Roll.import(original.export(format));
      expect(imported.result).toEqual(original.result);
      expect(imported.total).toBe(Infinity);
    },
  );

  test("normalizes legacy target modifiers inside conditional AST and results without rolling", () => {
    const data = JSON.parse(
      new Roll("(1) ? (d10>=5f=1) : (0)").export("json"),
    ) as {
      result: {
        node: {
          trueBranch: {
            modifiers: {
              rules?: { comparePoint: unknown }[];
              success?: unknown;
              failure?: unknown;
            }[];
          };
        };
        selectedResult: {
          node: {
            modifiers: {
              rules?: { comparePoint: unknown }[];
              success?: unknown;
              failure?: unknown;
            }[];
          };
        };
      };
    };
    for (const modifier of [
      data.result.node.trueBranch.modifiers[0],
      data.result.selectedResult.node.modifiers[0],
    ]) {
      modifier.success = modifier.rules![0].comparePoint;
      modifier.failure = modifier.rules![1].comparePoint;
      delete modifier.rules;
    }
    const settings = new RollSettings();
    const integer = jest.spyOn(settings.generator, "integer");
    const imported = Roll.import(data as unknown as EncodedRollData, settings);
    expect(integer).not.toHaveBeenCalled();
    expect(imported.result).toMatchObject({
      node: {
        trueBranch: {
          modifiers: [{ rules: [{ kind: "success" }, { kind: "failure" }] }],
        },
      },
      selectedResult: {
        node: {
          modifiers: [{ rules: [{ kind: "success" }, { kind: "failure" }] }],
        },
      },
    });
    expect(imported.reroll().result.type).toBe("conditional");
  });

  test.each([
    [
      "AST",
      "result.node.trueBranch.modifiers.0.rules",
      [],
      "expected at least one rule",
    ],
    [
      "stored result",
      "result.selectedResult.node.modifiers.0.rules",
      [],
      "expected at least one rule",
    ],
    [
      "non-array AST",
      "result.node.trueBranch.modifiers.0.rules",
      null,
      "expected an array",
    ],
  ] as [string, string, unknown, string][])(
    "rejects empty or malformed target rules in conditional %s data",
    (_description, path, value, message) => {
      expect(() =>
        Roll.import(corrupt("(1) ? (d10>=5) : (0)", path, value)),
      ).toThrow(message);
    },
  );

  test("valid critical, sort, min and max modifiers import without rolling", () => {
    const original = new Roll(
      conditional(
        1,
        pool(1, 6, {
          modifiers: [
            criticalSuccess(compare(">=", 5)),
            criticalFailure(compare("<=", 1)),
            sort("a"),
            max(5),
            min(2),
          ],
        }),
        0,
      ),
    );
    const settings = new RollSettings();
    const integer = jest.spyOn(settings.generator, "integer");
    const imported = Roll.import(original.export("object"), settings);

    expect(imported.result).toEqual(original.result);
    expect(integer).not.toHaveBeenCalled();
  });

  test("a malformed conditional makes a history import atomic", () => {
    const roller = new Roller();
    roller.roll("1");
    const valid = new Roll("2").export("object");
    const invalid = corrupt("(2) ? (3) : (4)", "result.selectedResult", null);
    const history = {
      type: "history" as const,
      version: 1 as const,
      rolls: [valid, invalid],
      total: 0,
    };
    expect(() => roller.import(history)).toThrow(ImportError);
    expect(roller.history).toHaveLength(1);
  });

  test.each<[string, string, unknown]>([
    ["result.node.trueBranch", "missing true branch", DELETE],
    ["result.node.falseBranch", "missing false branch", DELETE],
    ["result.node.falseBranch", "null false branch", null],
    ["result.node.condition", "missing check", DELETE],
    ["result.condition", "missing check result", DELETE],
    ["result.selectedBranch", "invalid selected branch", "other"],
    ["result.selectedBranch", "missing selected branch", DELETE],
    ["result.selectedResult", "missing selected result", DELETE],
    ["result.selectedResult.node", "mismatched selected node", reference],
  ])("rejects malformed %s: %s in every format", (path, _, value) => {
    const data = corrupt("(2) ? (3) : (4)", path, value);
    const json = JSON.stringify(data);
    for (const input of [data, json, toBase64(json)]) {
      expect(() => Roll.import(input)).toThrow(ImportError);
    }
  });

  test.each<[string, string]>([
    ["1+2", "result.node.left"],
    ["1+2", "result.left"],
    ["d6", "result.node.qty"],
    ["d6", "result.node.die.args.0"],
    ["d6", "result.qty"],
    ["d6", "result.dieArgs.0"],
    ["{1,2}", "result.node.expressions.0"],
    ["{1,2}", "result.members.0.result"],
    ["floor(1)", "result.node.args.0"],
    ["floor(1)", "result.args.0"],
    ["-1", "result.node.operand"],
    ["-1", "result.operand"],
    ["(1)", "result.node.expression"],
    ["(1)", "result.inner"],
  ])("imports structurally valid references in %s at %s", (notation, path) => {
    const value = path.includes(".node.") ? reference : referenceResult;
    expect(() => Roll.import(corrupt(notation, path, value))).not.toThrow();
  });

  test("generic references do not require a binding during import", () => {
    const roll = new Roll("(2) ? (($$condition) ? (3) : (4)) : (5)");
    expect(Roll.import(roll.export()).result).toEqual(roll.result);
    const data = corrupt("(2) ? (3) : (4)", "result.node.condition", {
      type: "conditional",
      condition: reference,
      trueBranch: reference,
      falseBranch: reference,
    });
    expect(() => Roll.import(data)).not.toThrow();
  });

  test("references in siblings are validated without requiring bindings", () => {
    const notation = "((2) ? (3) : (4))+1";
    expect(() =>
      Roll.import(corrupt(notation, "result.node.right", reference)),
    ).not.toThrow();
    expect(() =>
      Roll.import(corrupt(notation, "result.right", referenceResult)),
    ).not.toThrow();
  });

  test("a result's nested check is accepted without resolving its references", () => {
    const data = corrupt("(2) ? (3) : (4)", "result.condition", {
      type: "conditional",
      node: {
        type: "conditional",
        condition: { type: "number", value: 1 },
        trueBranch: reference,
        falseBranch: reference,
      },
      value: 1,
      condition: referenceResult,
      selectedBranch: "true",
      selectedResult: referenceResult,
    });
    expect(() => Roll.import(data)).not.toThrow();
  });

  test.each(["result.node.trueBranch", "result.selectedResult"])(
    "rejects obsolete condition-specific shapes at %s",
    (path) => {
      const obsoleteNode = { type: "condition-reference" };
      const obsoleteResult = {
        type: "condition-reference",
        node: obsoleteNode,
        value: 1,
      };
      const obsolete = path.endsWith(".node.trueBranch")
        ? obsoleteNode
        : obsoleteResult;

      expect(() =>
        Roll.import(corrupt("(2) ? (3) : (4)", path, obsolete)),
      ).toThrow(ImportError);
    },
  );
});
