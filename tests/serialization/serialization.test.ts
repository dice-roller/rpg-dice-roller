import { die, pool } from "../../src/ast/builders.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";
import { faceDie, rangeDie } from "../../src/dice/presets.js";
import { ImportError } from "../../src/errors/ImportError.js";
import { ValidationError } from "../../src/errors/ValidationError.js";
import { engines } from "../../src/index.js";
import { Roll } from "../../src/Roll.js";
import { Roller } from "../../src/Roller.js";
import { RollSettings } from "../../src/RollSettings.js";
import { decode } from "../../src/serialization/decode.js";
import {
  encode,
  encodeNumber,
  encodeNumbers,
  toBase64,
  toRollData,
} from "../../src/serialization/encode.js";
import { EXPORT_FORMATS } from "../../src/serialization/formats.js";
import type { EncodedRollData } from "../../src/serialization/formats.js";

const seeded = (seed = 1) =>
  new RollSettings({ engine: engines.MersenneTwister19937.seed(seed) });

/** A roll's JSON-safe data, as a plain mutable object, for corrupting. */
function dataOf(notation: string): Record<string, unknown> {
  return JSON.parse(new Roll(notation, seeded()).export()) as Record<
    string,
    unknown
  >;
}

describe("encoding numbers", () => {
  test.each([
    [4, 4],
    [-2.5, -2.5],
    [0, 0],
    [Number.POSITIVE_INFINITY, { $number: "Infinity" }],
    [Number.NEGATIVE_INFINITY, { $number: "-Infinity" }],
    [Number.NaN, { $number: "NaN" }],
  ])("%p is encoded as %p", (value, encoded) => {
    expect(encodeNumber(value)).toEqual(encoded);
  });

  test("nested numbers are encoded, everything else is copied", () => {
    const data = {
      a: [1, Number.POSITIVE_INFINITY, { b: Number.NaN }],
      text: "Infinity",
      flag: true,
      missing: undefined,
    };

    expect(encodeNumbers(data)).toEqual({
      a: [1, { $number: "Infinity" }, { b: { $number: "NaN" } }],
      text: "Infinity",
      flag: true,
    });
    expect(data.a[1]).toBe(Number.POSITIVE_INFINITY);
  });

  test("base64 is UTF-8, in chunks for long text", () => {
    const text = `🔥 ${"ünïcödé ".repeat(10_000)}`;

    const bytes = Uint8Array.from(atob(toBase64(text)), (char) =>
      char.charCodeAt(0),
    );

    expect(new TextDecoder().decode(bytes)).toBe(text);
    expect(toBase64("é")).toBe("w6k=");
  });
});

describe("rolls round-trip", () => {
  test.each(EXPORT_FORMATS)(
    "custom weighted dice round-trip and re-roll through %s",
    (format) => {
      const settings = new RollSettings();
      const originalIndices = [0, 2];
      jest
        .spyOn(settings.generator, "integer")
        .mockImplementation(() => originalIndices.shift() ?? 0);
      const original = new Roll("2d{ 1, 1, 2 } [damage]", settings);

      const rerollSettings = new RollSettings();
      const rerollIndices = [1, 2];
      const integer = jest
        .spyOn(rerollSettings.generator, "integer")
        .mockImplementation(() => rerollIndices.shift() ?? 0);
      const imported = Roll.import(
        original.export(format as "json"),
        rerollSettings,
      );

      expect(imported.notation).toBe(original.notation);
      expect(imported.result).toEqual(original.result);
      expect(integer).not.toHaveBeenCalled();

      const rerolled = imported.reroll();
      expect(rerolled.notation).toBe("2d{1,1,2} [damage]");
      expect(rerolled.result).toMatchObject({
        type: "pool",
        rolls: [{ value: 1 }, { value: 2 }],
      });
      expect(integer).toHaveBeenCalledTimes(2);
    },
  );

  test("a group containing custom dice survives import", () => {
    const original = new Roll("{d{0:2}, d6}k1 [group]", seeded());
    const imported = Roll.import(original.export());

    expect(imported.notation).toBe(original.notation);
    expect(imported.result).toEqual(original.result);
  });

  test.each(EXPORT_FORMATS)(
    "weighted targets round-trip through %s",
    (format) => {
      const original = new Roll("4d10>=5:2f=1:10>=10:3k2", seeded());
      const imported = Roll.import(original.export(format as "json"));
      expect(imported.result).toEqual(original.result);
      expect(imported.toString()).toBe(original.toString());
    },
  );

  test("legacy success and failure nodes are normalized on import", () => {
    const input = JSON.parse(new Roll("d10>=5f=1", seeded()).export()) as {
      result: {
        node: {
          modifiers: {
            rules?: { comparePoint: unknown }[];
            success?: unknown;
            failure?: unknown;
          }[];
        };
      };
    };
    const target = input.result.node.modifiers[0];
    target.success = target.rules![0].comparePoint;
    target.failure = target.rules![1].comparePoint;
    delete target.rules;
    const imported = Roll.import(JSON.stringify(input));
    expect(imported.result.node).toEqual(
      new Roll("d10>=5f=1", seeded()).result.node,
    );
  });

  test.each(EXPORT_FORMATS)("through %s", (format) => {
    const original = new Roll("4d6!kh3+{2d8, 1d4}k1*floor(d%/10)", seeded());
    const imported = Roll.import(original.export(format as "json"));

    expect(imported.notation).toBe(original.notation);
    expect(imported.result).toEqual(original.result);
    expect(imported.total).toBe(original.total);
    expect(imported.minTotal).toBe(original.minTotal);
    expect(imported.maxTotal).toBe(original.maxTotal);
    expect(imported.averageTotal).toBe(original.averageTotal);
    expect(imported.toString()).toBe(original.toString());
  });

  test("the object format is JSON-safe", () => {
    const data = new Roll("1/0+2d6", seeded()).export("object");

    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  test("toJSON() is the JSON export", () => {
    const roll = new Roll("2d6", seeded());

    expect(JSON.stringify(roll)).toBe(roll.export());
    expect(roll.toJSON()).toEqual(roll.export("object"));
    expect(Roll.fromJSON(roll.toJSON()).total).toBe(roll.total);
  });

  test("the data has the documented shape", () => {
    const roll = new Roll("2d6", seeded());

    expect(roll.export("object")).toEqual({
      type: "roll",
      version: 1,
      notation: "2d6",
      result: roll.result,
      total: roll.total,
      minTotal: 2,
      maxTotal: 12,
      averageTotal: 7,
    });
  });

  test("the base64 export is ASCII, and Unicode descriptions survive", () => {
    const original = new Roll("2d6 [🔥 fire — ünïcödé]", seeded());
    const base64 = original.export("base64");

    expect(base64).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(Roll.import(base64).description).toEqual({
      text: "🔥 fire — ünïcödé",
      style: "block",
    });
  });

  test("strings that look like numbers or tags stay strings", () => {
    const text = '{"$number":"Infinity"} NaN';
    const roll = Roll.import(new Roll(`2d6 [${text}]`, seeded()).export());

    expect(roll.description?.text).toBe(text);
  });

  test("whitespace around JSON and base64 is ignored", () => {
    const roll = new Roll("2d6", seeded());

    expect(Roll.import(`  ${roll.export()}\n`).total).toBe(roll.total);
    expect(Roll.import(`\n${roll.export("base64")} `).total).toBe(roll.total);
  });
});

describe("non-finite numbers", () => {
  test.each([
    ["1/0", Number.POSITIVE_INFINITY],
    ["-1/0", Number.NEGATIVE_INFINITY],
    ["2d6*(1/0)", Number.POSITIVE_INFINITY],
  ])("%s round-trips through every format", (notation, total) => {
    const roll = new Roll(notation, seeded());

    for (const format of EXPORT_FORMATS) {
      const imported = Roll.import(roll.export(format as "json"));

      expect(imported.total).toBe(total);
      expect(imported.result.value).toBe(total);
      expect(imported.minTotal).toBe(roll.minTotal);
      expect(imported.maxTotal).toBe(roll.maxTotal);
    }
  });

  test("they're tagged rather than turned into null", () => {
    const json = new Roll("1/0", seeded()).export();

    expect(json).toContain('"total":{"$number":"Infinity"}');
    expect(json).not.toContain("null");
  });

  test("a derived NaN history total round-trips", () => {
    const roller = new Roller();

    roller.roll("1/0");
    roller.roll("-1/0");

    expect(roller.history.total).toBeNaN();
    expect(roller.export()).toContain('"total":{"$number":"NaN"}');

    for (const format of EXPORT_FORMATS) {
      const data = decode(roller.export(format as "json"));
      const imported = new Roller();

      expect(data.type === "history" && data.total).toBeNaN();
      imported.import(roller.export(format as "json"));
      expect(imported.history.total).toBeNaN();
      expect(imported.history.rolls.map(({ total }) => total)).toEqual([
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
      ]);
    }
  });

  test("plain data with raw non-finite numbers can be imported", () => {
    const data = toRollData(new Roll("1/0", seeded()));

    expect(Roll.fromJSON(data).total).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("histories", () => {
  test.each(EXPORT_FORMATS)("round-trip through %s", (format) => {
    const roller = new Roller({ engine: engines.MersenneTwister19937.seed(3) });

    roller.roll("4d6");
    roller.roll("2d10!+3");

    const imported = new Roller();
    const rolls = imported.import(roller.export(format as "json"));

    expect(rolls).toHaveLength(2);
    expect(imported.history.rolls).toEqual(rolls);
    expect(imported.history.total).toBe(roller.history.total);
    expect(String(imported)).toBe(String(roller));
    expect(JSON.stringify(roller.history)).toBe(roller.export());
  });

  test("a single roll can be imported into a roller", () => {
    const roller = new Roller();
    const [roll] = roller.import(new Roll("2d6", seeded()).export("base64"));

    expect(roll?.notation).toBe("2d6");
    expect(roller.history).toHaveLength(1);
  });

  test("an empty history round-trips", () => {
    const roller = new Roller();

    expect(roller.export("object")).toEqual({
      type: "history",
      version: 1,
      rolls: [],
      total: 0,
    });
    expect(new Roller().import(roller.export())).toEqual([]);
  });

  test("a history import is atomic", () => {
    const roller = new Roller();
    const valid = dataOf("2d6");
    const history = {
      type: "history",
      version: 1,
      rolls: [valid, { ...valid, total: "nope" }],
      total: 0,
    };

    roller.roll("1d4");

    expect(() => roller.import(JSON.stringify(history))).toThrow(ImportError);
    expect(roller.history).toHaveLength(1);
  });

  test("Roll.import() rejects a history", () => {
    expect(() => Roll.import(new Roller().export())).toThrow(ImportError);
    expect(() => Roll.fromJSON(new Roller().export("object") as never)).toThrow(
      ImportError,
    );
  });
});

describe("importing doesn't roll", () => {
  test("no generator is used, and stored totals are kept", () => {
    const data = new Roll("4d6!kh3", seeded()).export();
    const settings = new RollSettings();
    const integer = jest.spyOn(settings.generator, "integer");
    const evaluate = jest.spyOn(settings, "evaluate");
    const roll = Roll.import(data, settings);

    expect(roll.minTotal).toBe(3);
    expect(roll.averageTotal).toBe((3 + roll.maxTotal) / 2);
    expect(integer).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
  });

  test("a roller import doesn't use its generator", () => {
    const roller = new Roller();
    const integer = jest.spyOn(roller.generator, "integer");

    roller.import(new Roll("10d20", seeded()).export());

    expect(integer).not.toHaveBeenCalled();
  });

  test("the imported roll doesn't share the input data", () => {
    const data = dataOf("2d6");
    const roll = Roll.import(data as EncodedRollData);

    (data.result as { value: number }).value = 100;

    expect(roll.result.value).not.toBe(100);
  });
});

describe("re-rolling imported rolls", () => {
  const fib = () => faceDie([1, 1, 2, 3, 5, 8], { notation: "fib" });

  test("uses the die registered in the import's settings", () => {
    const dice = new DieRegistry().register("fib", fib);
    const data = new Roll(pool(2, die("fib")), { dice }).export();

    // importing needs no dice; re-rolling does
    const without = Roll.import(data);

    expect(without.toString()).toMatch(/^2dfib\(\): \[\d, \d\] = \d+$/);
    expect(() => without.reroll()).toThrow(ValidationError);

    const rerolled = Roll.import(data, { dice }).reroll();

    expect(rerolled.result.type).toBe("pool");
    expect(rerolled.result.value).toBeGreaterThanOrEqual(2);
  });

  test("custom notation re-rolls use replacement range and face factories", () => {
    const dice = new DieRegistry()
      .register("face", (...faces) => faceDie(faces.map((face) => face + 10)))
      .register("range", (min, max) => rangeDie(min + 10, max + 10));
    const settings = new RollSettings({ dice });
    jest.spyOn(settings.generator, "integer").mockImplementation((min) => min);

    const faceData = new Roll("d{1,1,2}", seeded()).export("object");
    const rangeData = new Roll("d{0:2}", seeded()).export("object");

    expect(Roll.import(faceData, settings).reroll().total).toBe(11);
    expect(Roll.import(rangeData, settings).reroll().total).toBe(10);
  });

  test("imported face nodes retain explicit precision when re-rolled", () => {
    const settings = new RollSettings();
    jest.spyOn(settings.generator, "integer").mockReturnValue(0);

    const data = new Roll("d{0.123456789012345}", settings).export("object");
    const imported = Roll.import(data, settings);
    const rerolled = imported.reroll();

    expect(rerolled.result).toMatchObject({
      type: "pool",
      rolls: [{ value: 0.123456789012345 }],
    });
  });

  test("keeps the configured presenter", () => {
    const presenter = { present: () => "custom" };
    const roller = new Roller({ presenter });
    const [roll] = roller.import(new Roll("2d6", seeded()).export());

    expect(roll?.present()).toBe("custom");
    expect(roll?.reroll().present()).toBe("custom");
    expect(roll?.toString()).toMatch(/^2d6: \[\d, \d\] = \d+$/);
    expect(roller.present()).toBe("custom");
  });
});

describe("invalid data", () => {
  test.each(["d6>4", "{1,2}>1"])(
    "rejects imported ASTs with multiple targets for %s",
    (notation) => {
      const data = dataOf(notation) as {
        result: { node: { modifiers: unknown[] } };
      };
      const { modifiers } = data.result.node;
      modifiers.push(modifiers[0]);

      expect(() => Roll.import(JSON.stringify(data))).toThrow(ImportError);
    },
  );

  test.each([
    ["an empty string", ""],
    ["whitespace", "   "],
    ["text", "not json!"],
    ["broken JSON", '{"type": "roll"'],
    ["a JSON array", "[]"],
    ["a JSON string", '"roll"'],
    ["base64 of a different length", "abc"],
    ["base64 with invalid characters", "ab$d"],
    ["base64 that isn't UTF-8", "/w=="],
    ["base64 that isn't JSON", toBase64("hello")],
    ["base64 of an empty object", toBase64("{}")],
  ])("%s throws an ImportError", (_, input) => {
    expect(() => decode(input)).toThrow(ImportError);
    expect(() => Roll.import(input)).toThrow(ImportError);
    expect(() => new Roller().import(input)).toThrow(ImportError);
  });

  const DELETE = Symbol("delete");

  /** The roll's exported JSON, with the value at the dotted path replaced (or deleted). */
  function corrupt(notation: string, path: string, value: unknown): string {
    const data = dataOf(notation);
    const keys = path.split(".");
    const last = keys.pop() ?? "";
    let parent: Record<string, unknown> = data;

    for (const key of keys) {
      parent = parent[key] as Record<string, unknown>;
    }

    if (value === DELETE) {
      delete parent[last];
    } else {
      parent[last] = value;
    }

    return JSON.stringify(data);
  }

  test.each<[string, string, string, unknown]>([
    ["an unknown type", "2d6", "type", "dice"],
    ["a missing type", "2d6", "type", DELETE],
    ["an unknown version", "2d6", "version", 2],
    ["a missing version", "2d6", "version", DELETE],
    ["a missing notation", "2d6", "notation", DELETE],
    ["a non-string notation", "2d6", "notation", 4],
    ["a missing result", "2d6", "result", DELETE],
    ["a string total", "2d6", "total", "7"],
    ["a null total", "2d6", "minTotal", null],
    ["an unknown number tag", "2d6", "total", { $number: "Inf" }],
    [
      "a number tag with other properties",
      "2d6",
      "total",
      { $number: "Infinity", extra: 1 },
    ],
    ["an unknown result type", "2d6", "result.type", "dice"],
    [
      "a result whose node doesn't match",
      "2d6",
      "result.node",
      { type: "number", value: 2 },
    ],
    ["a string roll value", "2d6", "result.rolls.0.value", "3"],
    ["an unknown flag", "2d6", "result.rolls.0.flags", ["lucky"]],
    ["a missing die snapshot", "2d6", "result.die", DELETE],
    ["a non-boolean useInTotal", "2d6", "result.rolls.0.useInTotal", 1],
    [
      "a bad target amount",
      "d10>=1:2",
      "result.node.modifiers.0.rules.0.amount",
      0,
    ],
    [
      "a non-finite number in the notation",
      "2d6+1",
      "result.node.right.value",
      { $number: "Infinity" },
    ],
    ["an unknown operator", "2d6+1", "result.node.op", "&"],
    ["an unknown function", "floor(2.5)", "result.node.name", "eval"],
    ["a die without a name", "2d6", "result.node.die.name", ""],
    ["an unknown modifier", "4d6kh1", "result.node.modifiers.0.name", "magic"],
    ["a keep of 0 dice", "4d6kh1", "result.node.modifiers.0.qty", 0],
    [
      "an unknown compare operator",
      "4d6>3",
      "result.node.modifiers.0.rules.0.comparePoint.operator",
      "~",
    ],
    [
      "an invalid description",
      "4d6 [fire]",
      "result.node.description.style",
      "bold",
    ],
    ["a group without expressions", "{2d6}", "result.node.expressions", []],
    ["an invalid group member", "{2d6, 3}", "result.members.1.type", "member"],
  ])("%s throws an ImportError", (_, notation, path, value) => {
    const input = corrupt(notation, path, value);

    expect(() => Roll.import(input)).toThrow(ImportError);
    expect(() => Roll.import(toBase64(input))).toThrow(ImportError);
  });

  test("the error says where the data is invalid", () => {
    const input = corrupt("2d6", "result.rolls.1.value", "x");

    expect(() => Roll.import(input)).toThrow(
      "Invalid import data at data.result.rolls[1].value: expected a number",
    );
  });

  test("invalid JSON keeps the parser's error as the cause", () => {
    try {
      decode("{");
    } catch (error) {
      expect(error).toBeInstanceOf(ImportError);
      expect((error as Error).cause).toBeInstanceOf(SyntaxError);
    }

    expect.assertions(2);
  });
});

describe("encode()", () => {
  test("defaults to JSON", () => {
    const data = toRollData(new Roll("2d6", seeded()));

    expect(encode(data)).toBe(JSON.stringify(encodeNumbers(data)));
    expect(encode(data, "base64")).toBe(toBase64(encode(data)));
  });
});
