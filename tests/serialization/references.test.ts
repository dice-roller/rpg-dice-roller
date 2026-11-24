import { ImportError } from "../../src/errors/ImportError.js";
import { Roll } from "../../src/Roll.js";
import { Roller } from "../../src/Roller.js";
import { RollSettings } from "../../src/RollSettings.js";
import { EXPORT_FORMATS } from "../../src/serialization/formats.js";
import type {
  EncodedExportData,
  EncodedRollData,
} from "../../src/serialization/formats.js";

const SENTINEL = 987654321;

function rollData(): { profile: { score: number; sentinel: number } } {
  return { profile: { score: 5, sentinel: SENTINEL } };
}

function alternateData(): { profile: { score: number; sentinel: number } } {
  return { profile: { score: 9, sentinel: SENTINEL } };
}

function mutateExport(
  changes: readonly [path: string, value: unknown][],
): EncodedRollData {
  const data = JSON.parse(
    new Roll("$profile.score", { data: rollData() }).export("json"),
  ) as Record<string, unknown>;

  for (const [path, value] of changes) {
    const keys = path.split(".");
    const last = keys.pop()!;
    let parent = data;

    for (const key of keys) {
      parent = parent[key] as Record<string, unknown>;
    }

    parent[last] = value;
  }

  return data as unknown as EncodedRollData;
}

function exportText(value: string | EncodedExportData): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

describe("reference serialization", () => {
  test.each(EXPORT_FORMATS)(
    "rolls and histories preserve references through %s without exporting input data",
    (format) => {
      const roller = new Roller({
        engine: { name: "mersenne", seed: 42 },
        data: rollData(),
      });
      const original = roller.roll("d6+$profile.score");
      const exportedRoll = original.export(format);
      const exportedHistory = roller.export(format);

      expect(exportText(exportedRoll)).not.toContain(String(SENTINEL));
      expect(exportText(exportedHistory)).not.toContain(String(SENTINEL));
      expect(original.result).toMatchObject({
        type: "binary",
        right: {
          type: "reference",
          node: {
            type: "reference",
            namespace: "data",
            path: ["profile", "score"],
          },
          value: 5,
        },
      });

      const settings = new RollSettings({
        engine: { name: "mersenne", seed: 42 },
        data: alternateData(),
      });
      const integer = jest.spyOn(settings.generator, "integer");
      const imported = Roll.import(exportedRoll, settings);

      expect(imported.result).toEqual(original.result);
      expect(imported.export("object")).toEqual(original.export("object"));
      expect(imported.toString()).toContain("$profile.score");
      expect(integer).not.toHaveBeenCalled();
      expect(imported.reroll().total - original.total).toBe(4);
      expect(integer).toHaveBeenCalledTimes(1);

      const importedRoller = new Roller({
        engine: { name: "mersenne", seed: 42 },
        data: alternateData(),
      });
      const historyInteger = jest.spyOn(importedRoller.generator, "integer");
      const [historyRoll] = importedRoller.import(exportedHistory);

      expect(historyRoll.result).toEqual(original.result);
      expect(historyInteger).not.toHaveBeenCalled();
      expect(historyRoll.reroll().total - original.total).toBe(4);
      expect(historyInteger).toHaveBeenCalledTimes(1);
    },
  );

  test("imports reference results with keep modifiers without rolling", () => {
    const engine = { name: "mersenne", seed: 42 } as const;
    const original = new Roll("2d6kh1+$profile.score", {
      engine,
      data: rollData(),
    });
    const serialized = original.export("object");
    const settings = new RollSettings({ engine, data: alternateData() });
    const integer = jest.spyOn(settings.generator, "integer");
    const imported = Roll.import(serialized, settings);

    expect(imported.result).toEqual(original.result);
    expect(imported.total).toBe(original.total);
    expect(imported.toString()).toContain("$profile.score");
    expect(exportText(imported.export("object"))).not.toContain(
      String(SENTINEL),
    );
    expect(integer).not.toHaveBeenCalled();

    expect(imported.reroll().total - original.total).toBe(4);
    expect(integer).toHaveBeenCalledTimes(2);
  });

  test("an imported result remains readable without data, but reroll needs a binding", () => {
    const original = new Roll("$profile.score", { data: rollData() });
    const imported = Roll.import(original.export("object"));

    expect(imported.total).toBe(5);
    expect(imported.toString()).toContain("$profile.score");
    expect(() => imported.reroll()).toThrow("$profile.score");
    expect(imported.total).toBe(5);
  });

  const malformedReferenceChanges: [readonly [string, unknown][]][] = [
    [[["result.node.namespace", "other"]]],
    [[["result.node.path", []]]],
    [[["result.node.path.0", "bad-name"]]],
  ];

  test.each(malformedReferenceChanges)(
    "rejects malformed reference node data %#",
    (changes) => {
      expect(() => Roll.import(mutateExport(changes))).toThrow(ImportError);
    },
  );

  test("imports system references whose path starts with data", () => {
    const data = mutateExport([
      ["result.node.namespace", "system"],
      ["result.node.path", ["data", "profile", "score"]],
    ]);
    const imported = Roll.import(data);

    expect(imported.result).toMatchObject({
      type: "reference",
      node: {
        type: "reference",
        namespace: "system",
        path: ["data", "profile", "score"],
      },
      value: 5,
    });
  });
});
