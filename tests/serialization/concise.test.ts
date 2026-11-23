import { ImportError } from "../../src/errors/ImportError.js";
import { dice, Roll, Roller } from "../../src/index.js";
import type { ConciseRollData } from "../../src/index.js";
import { toBase64 } from "../../src/serialization/encode.js";

const finished: ConciseRollData = {
  notation: "3d6kh2 + d8min3 * 2",
  rolls: [
    [6, { value: 3, useInTotal: false, flags: ["drop"] }, 5],
    [{ initialValue: 1, value: 3, flags: ["min"] }],
  ],
};

describe("concise roll import", () => {
  test.each([
    finished,
    JSON.stringify(finished),
    toBase64(JSON.stringify(finished)),
  ])(
    "restores supplied scoring, supports presentation and exports a full snapshot",
    (data) => {
      const next = jest.fn(() => {
        throw new Error("Unexpected random draw");
      });
      const roll = Roll.import(data, { engine: { next } });

      expect(roll.total).toBe(17);
      expect(roll.present()).toContain("[6, 3d, 5]+[3^]*2 = 17");
      expect(Roll.import(roll.export()).toJSON()).toEqual(roll.toJSON());
      expect(next).not.toHaveBeenCalled();
    },
  );

  test("takes the final value as supplied, including finished extra dice", () => {
    expect(Roll.import({ notation: "d8min3", rolls: [[1]] }).total).toBe(1);
    expect(Roll.import({ notation: "d6!", rolls: [[6, 3]] }).total).toBe(9);
    expect(
      Roll.import({
        notation: "d6>=4",
        rolls: [[{ value: 5, calculationValue: 0 }]],
      }).total,
    ).toBe(0);
  });

  test("keeps sorted members attached to their original die and scores group members", () => {
    const roll = Roll.import({
      notation: "{d6,d8}sa",
      rolls: [[5], [2]],
      groups: {
        0: {
          order: [1, 0],
          members: { 0: { useInTotal: false, flags: ["drop"] } },
        },
      },
    });

    expect(roll.total).toBe(2);
    expect(roll.result).toMatchObject({
      type: "group",
      members: [
        { result: { die: { notation: "8" }, value: 2 } },
        { result: { die: { notation: "6" }, value: 5 }, useInTotal: false },
      ],
    });
  });

  test("takes the parent pool first, followed by pools in its parameters and computed modifiers", () => {
    const roll = Roll.import({
      notation: "(d4)d(d8)kh(d2)",
      rolls: [[4, 5], [2], [6], [1]],
    });

    expect(roll.total).toBe(9);
    expect(roll.result).toMatchObject({
      type: "pool",
      qty: { value: 2 },
      die: { notation: "6" },
      modifierArguments: [{ modifierIndex: 0, result: { value: 1 } }],
    });
  });

  test("reads pools only in the condition and selected branch", () => {
    const roll = Roll.fromJSON({
      notation: "(d6 < 3) ? (d8) : (d10)",
      rolls: [[2], [5]],
    });

    expect(roll.total).toBe(5);
    expect(roll.result).toMatchObject({
      type: "conditional",
      selectedBranch: "true",
      selectedResult: { die: { notation: "8" } },
    });
  });

  test("appends to a roller's history only after reconstruction succeeds", () => {
    const roller = new Roller({ data: { bonus: 2 } });
    const [roll] = roller.import({ notation: "d6 + $bonus", rolls: [[3]] });
    expect(roller.history.rolls).toEqual([roll]);
    expect(roller.history.total).toBe(5);
    expect(() => roller.import({ notation: "d6", rolls: [] })).toThrow(
      ImportError,
    );
    expect(roller.history.rolls).toEqual([roll]);
  });

  test("uses default group member scores and preserves explicit score overrides in nested groups", () => {
    const roll = Roll.import({
      notation: "{d6,{d8,d10}}",
      rolls: [[5], [2], [7]],
      groups: {
        1: {
          members: {
            0: { value: 3 },
            1: { value: 8, calculationValue: -1, useInTotal: true },
          },
        },
      },
    });

    expect(roll.total).toBe(7);
    expect(roll.result).toMatchObject({
      type: "group",
      members: [
        { value: 5, calculationValue: 5, useInTotal: true, flags: [] },
        {
          value: 2,
          result: {
            type: "group",
            members: [
              { value: 3, calculationValue: 3, result: { value: 2 } },
              { value: 8, calculationValue: -1, result: { value: 7 } },
            ],
          },
        },
      ],
    });
  });

  test("retains computed group modifier arguments in execution order without applying the modifiers", () => {
    const roll = Roll.import({
      notation: "{d6,d8}dl(d4)kh(d2)",
      rolls: [[6], [7], [1], [2]],
    });

    expect(roll.total).toBe(13);
    expect(roll.result).toMatchObject({
      type: "group",
      modifierArguments: [
        { modifierIndex: 1, result: { value: 1 } },
        { modifierIndex: 0, result: { value: 2 } },
      ],
      members: [{ useInTotal: true }, { useInTotal: true }],
    });
    expect(Roll.import(roll.export()).toJSON()).toEqual(roll.toJSON());
  });

  test("allows an empty pool when the evaluated quantity is zero", () => {
    const roll = Roll.import({ notation: "(0)d6 + 2", rolls: [[]] });

    expect(roll.total).toBe(2);
    expect(roll.result).toMatchObject({
      left: { qty: { value: 0 }, rolls: [] },
    });
  });

  test.each([-1, 1.5, 4])(
    "rejects invalid evaluated dice quantity %s",
    (qty) => {
      expect(() =>
        Roll.import(
          { notation: "($qty)d6", rolls: [[1]] },
          { limits: { maxQty: 3 }, data: { qty } },
        ),
      ).toThrow(`Invalid dice quantity for data.rolls[0]: ${qty}`);
    },
  );

  test("preserves the cause of a failing custom die factory", () => {
    const registry = new dice.DieRegistry();
    const cause = { reason: "failed to construct the die" };
    registry.register("standard", () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- JavaScript factories can throw plain objects.
      throw cause;
    });

    try {
      Roll.import({ notation: "d6", rolls: [[1]] }, { dice: registry });
      throw new Error("Expected import to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ImportError);
      expect(error).toMatchObject({
        message: "Could not reconstruct the concise roll",
        cause,
      });
    }
  });

  test.each<[unknown, RegExp]>([
    [{ notation: "d6+d8", rolls: [[1]] }, /Missing pool results.*rolls\[1\]/],
    [{ notation: "d6", rolls: [[1], [2]] }, /Unused pool results.*rolls\[1\]/],
    [
      { notation: "d6", rolls: [[{ value: 1, useInTotal: 0 }]] },
      /useInTotal.*boolean/,
    ],
    [
      { notation: "d6", rolls: [[{ value: 1, flags: ["unknown"] }]] },
      /flags\[0\]/,
    ],
    [{ notation: "d6", rolls: [], rawRolls: [1] }, /rawRolls/],
    [
      {
        notation: "{d6,d8}",
        rolls: [[1], [2]],
        groups: { 0: { order: [1, 1] } },
      },
      /permutation/,
    ],
    [
      { notation: "d6", rolls: [[1]], groups: { 0: { order: [0] } } },
      /Unknown group/,
    ],
    [
      { notation: "invalid", rolls: [] },
      /Could not reconstruct.*Invalid notation/,
    ],
    [{ notation: "d6kh(d2-2)", rolls: [[1], [1]] }, /computed keep quantity/],
    [
      { notation: "d6", rolls: [[{ value: 1, initialValue: "1" }]] },
      /initialValue.*expected a number/,
    ],
    [
      { notation: "d6", rolls: [[{ value: 1, calculationValue: null }]] },
      /calculationValue.*expected a number/,
    ],
    [
      { notation: "{d6,d8}", rolls: [[1], [2]], groups: { first: {} } },
      /groups\.first.*index/,
    ],
    [
      {
        notation: "{d6,d8}",
        rolls: [[1], [2]],
        groups: { 0: { order: ["1", 0] } },
      },
      /order\[0\].*safe integer/,
    ],
    [
      {
        notation: "{d6,d8}",
        rolls: [[1], [2]],
        groups: { 0: { order: [0, -1] } },
      },
      /order\[1\].*safe integer/,
    ],
    [
      {
        notation: "{d6,d8}",
        rolls: [[1], [2]],
        groups: { 0: { order: [0, 1.5] } },
      },
      /order\[1\].*safe integer/,
    ],
    [
      { notation: "{d6,d8}", rolls: [[1], [2]], groups: { 0: { order: [0] } } },
      /permutation/,
    ],
    [
      {
        notation: "{d6,d8}",
        rolls: [[1], [2]],
        groups: { 0: { order: [0, 2] } },
      },
      /permutation/,
    ],
    [
      {
        notation: "{d6,d8}",
        rolls: [[1], [2]],
        groups: { 0: { members: { 2: {} } } },
      },
      /Unknown group member.*members\.2/,
    ],
  ])("rejects invalid input %j", (data, message) => {
    const json = JSON.stringify(data);
    expect(() => Roll.import(json)).toThrow(ImportError);
    expect(() => Roll.import(json)).toThrow(message);
  });
});
