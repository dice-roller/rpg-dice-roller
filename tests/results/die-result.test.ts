import {
  createDieResult,
  excludeFromTotal,
  withCalculationValue,
  withFlags,
  withValue,
} from "../../src/results/die-result.js";
import type { GroupMemberResult } from "../../src/results/types.js";

describe("die results", () => {
  test("createDieResult() sets every value", () => {
    expect(createDieResult(4)).toEqual({
      type: "die",
      value: 4,
      initialValue: 4,
      calculationValue: 4,
      useInTotal: true,
      flags: [],
    });
  });

  test("withFlags() adds each flag at most once", () => {
    const item = withFlags(createDieResult(6), "explode");

    expect(withFlags(item, "explode", "max", "max").flags).toEqual([
      "explode",
      "max",
    ]);
  });

  test("withValue() changes the value and calculation value, keeping the initial value", () => {
    expect(withValue(createDieResult(2), 5)).toMatchObject({
      value: 5,
      calculationValue: 5,
      initialValue: 2,
    });
  });

  test("withCalculationValue() keeps the value", () => {
    expect(withCalculationValue(createDieResult(8), 1)).toMatchObject({
      value: 8,
      calculationValue: 1,
    });
  });

  test("excludeFromTotal() excludes the item", () => {
    expect(excludeFromTotal(createDieResult(3)).useInTotal).toBe(false);
  });

  test("helpers never change the original", () => {
    const original = Object.freeze(createDieResult(3));
    const flagsBefore = original.flags;

    expect(withFlags(original, "drop")).not.toBe(original);
    expect(withValue(original, 1)).not.toBe(original);
    expect(withCalculationValue(original, 1)).not.toBe(original);
    expect(excludeFromTotal(original)).not.toBe(original);
    expect(original).toEqual(createDieResult(3));
    expect(original.flags).toBe(flagsBefore);
  });

  test("helpers keep the other properties of any scored item", () => {
    const member: GroupMemberResult = {
      type: "group-member",
      result: { type: "number", node: { type: "number", value: 3 }, value: 3 },
      value: 3,
      calculationValue: 3,
      useInTotal: true,
      flags: [],
    };

    const changed = excludeFromTotal(withFlags(withValue(member, 4), "drop"));

    expect(changed).toEqual({
      ...member,
      value: 4,
      calculationValue: 4,
      useInTotal: false,
      flags: ["drop"],
    });
    expect(changed.result).toBe(member.result);
  });
});
