import {
  binary as astBinary,
  comparison,
  conditional,
  conditionReference,
  die,
  fn,
  group,
  keep,
  negate,
  paren,
  pool,
} from "../../src/ast/builders.js";
import type { ExpressionNode } from "../../src/ast/nodes.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import { maxHandler } from "../../src/modifiers/handlers/index.js";
import {
  TextPresenter,
  defaultTextPresenter,
} from "../../src/presenters/TextPresenter.js";
import type { ComparisonResult, PoolResult } from "../../src/results/types.js";
import { Roll } from "../../src/Roll.js";
import { Roller } from "../../src/Roller.js";
import { RollHistory } from "../../src/RollHistory.js";
import { RollSettings } from "../../src/RollSettings.js";

/** Settings whose generator returns the queued values (then the minimum). */
function settingsWith(rolls: readonly number[]): RollSettings {
  const settings = new RollSettings();
  const queue = [...rolls];

  jest
    .spyOn(settings.generator, "integer")
    .mockImplementation((min) => queue.shift() ?? min);

  return settings;
}

function rollWith(
  input: string | ExpressionNode,
  rolls: readonly number[] = [],
): Roll {
  return new Roll(input, settingsWith(rolls));
}

describe("rolls (v5 output)", () => {
  test.each<[string, number[], string]>([
    ["4+8", [], "4+8: 4+8 = 12"],
    ["4d8", [6, 2, 5, 8], "4d8: [6, 2, 5, 8] = 21"],
    [
      "2d7 + (5d4 * 2)",
      [5, 2, 4, 2, 1, 3, 3],
      "2d7 + (5d4 * 2): [5, 2]+([4, 2, 1, 3, 3]*2) = 33",
    ],
    ["floor(2.56 * d7)", [5], "floor(2.56 * d7): floor(2.56*[5]) = 12"],
    ["ceil(2.56 * d7)", [5], "ceil(2.56 * d7): ceil(2.56*[5]) = 13"],
    [
      "max(2 * (d7/2), 1d7)",
      [5, 2],
      "max(2 * (d7/2), 1d7): max(2*([5]/2),[2]) = 5",
    ],
    [
      "min(2 * (d7/2), 1d7)",
      [5, 2],
      "min(2 * (d7/2), 1d7): min(2*([5]/2),[2]) = 2",
    ],
    [
      "(4d10^7)*6d(3*2)",
      [4, 5, 6, 10, 3, 4, 6, 4, 1, 3],
      "(4d10^7)*6d(3*2): ([4, 5, 6, 10]^7)*[3, 4, 6, 4, 1, 3] = 128173828125",
    ],
    [
      "5d6%2d20",
      [4, 5, 6, 3, 2, 9, 20],
      "5d6%2d20: [4, 5, 6, 3, 2]%[9, 20] = 20",
    ],
    ["1d20+-5", [20], "1d20+-5: [20]+-5 = 15"],
    ["1d20--6", [20], "1d20--6: [20]--6 = 26"],
    ["1d20+1.45", [8], "1d20+1.45: [8]+1.45 = 9.45"],
    ["1d20*0.20", [8], "1d20*0.20: [8]*0.2 = 1.6"],
    ["1d20/6.02", [8], "1d20/6.02: [8]/6.02 = 1.33"],
    ["1d20+0", [8], "1d20+0: [8]+0 = 8"],
    ["2**3", [], "2**3: 2^3 = 8"],
    ["1/0", [], "1/0: 1/0 = Infinity"],
  ])("%s", (notation, rolls, expected) => {
    expect(rollWith(notation, rolls).toString()).toBe(expected);
  });
});

describe("dice and modifier flags (v5 output and documented examples)", () => {
  test.each<[string, number[], string]>([
    ["d%", [42], "d%: [42] = 42"],
    ["4dF", [0, 1, 2, 2], "4dF: [-1, 0, 1, 1] = 1"],
    ["3d6cs>3cf<3", [5, 4, 1], "3d6cs>3cf<3: [5cs, 4cs, 1cf] = 10"],
    ["4d6sd", [1, 4, 6, 5], "4d6sd: [6, 5, 4, 1] = 16"],
    ["2d6r<=4", [3, 5, 6], "2d6r<=4: [6r, 5] = 11"],
    ["2d6ro", [1, 5, 1], "2d6ro: [1ro, 5] = 6"],
    ["d6r2:2", [1, 4, 1, 3, 5], "d6r2:2: [4r, 3r, 5r] = 12"],
    ["d6!1:2", [6, 3, 4], "d6!1:2: [6!, 3, 4] = 13"],
    [
      "6d10>=8!>=9",
      [4, 5, 6, 3, 10, 8, 6],
      "6d10>=8!>=9: [4, 5, 6, 3, 10!*, 6, 8*] = 2",
    ],
    [
      "6d10min3max6",
      [8, 1, 3, 9, 2, 7],
      "6d10min3max6: [6v, 3^, 3, 6v, 3^, 6v] = 27",
    ],
    ["2d6u", [4, 4, 6], "2d6u: [4, 6u] = 10"],
    ["2d6uo", [4, 4, 4], "2d6uo: [4, 4uo] = 8"],
    ["2d6!m", [4, 4, 4, 5], "2d6!m: [4!m, 4!m, 4, 5] = 17"],
    ["2d6!m>=5f<=2", [6, 6, 1, 1], "2d6!m>=5f<=2: [6!m, 6!m, 1mf, 1mf] = 0"],
    ["2d6!", [4, 6, 6, 2], "2d6!: [4, 6!, 6!, 2] = 18"],
    ["2d6!!", [4, 6, 6, 2], "2d6!!: [4, 14!!] = 18"],
    ["2d6!p", [6, 1, 6, 6, 4], "2d6!p: [6!p, 5!p, 5!p, 3, 1] = 20"],
    ["2d6!!p", [6, 1, 6, 6, 4], "2d6!!p: [19!!p, 1] = 20"],
    ["6d8k3", [3, 6, 7, 2, 5, 4], "6d8k3: [3d, 6, 7, 2d, 5, 4d] = 18"],
    ["6d8dh3", [3, 6, 7, 2, 5, 4], "6d8dh3: [3, 6d, 7d, 2, 5d, 4] = 9"],
    ["3d10k1dh1", [7, 1, 2], "3d10k1dh1: [7d, 1d, 2d] = 0"],
    ["4d6min3", [1, 4, 3, 2], "4d6min3: [3^, 4, 3, 3^] = 13"],
    ["4d6max3", [5, 4, 3, 2], "4d6max3: [3v, 3v, 3, 2] = 11"],
    ["4d6>4f<3", [2, 5, 4, 5], "4d6>4f<3: [2_, 5*, 4, 5*] = 1"],
    ["2d20cs", [4, 20], "2d20cs: [4, 20cs] = 24"],
    ["2d20cf", [4, 1], "2d20cf: [4, 1cf] = 5"],
  ])("%s", (notation, rolls, expected) => {
    expect(rollWith(notation, rolls).toString()).toBe(expected);
  });
});

describe("groups (v5 output and documented examples)", () => {
  test.each<[string, number[], string]>([
    [
      "{4d6, 2d10, d4}",
      [2, 6, 4, 2, 7, 4, 1],
      "{[2, 6, 4, 2], [7, 4], [1]} = 26",
    ],
    ["{4d10+5}", [4, 5, 1, 3], "{[4, 5, 1, 3]+5} = 18"],
    [
      "{4d10, 5d6, 2d10}k2",
      [8, 1, 4, 1, 1, 5, 1, 5, 3, 6, 3],
      "{[8, 1, 4, 1], [1, 5, 1, 5, 3], ([6, 3])d} = 29",
    ],
    ["{5+d10, 3d4*2}k1", [8, 3, 2, 2], "{(5+[8])d, [3, 2, 2]*2} = 14"],
    [
      "{4d10*(2+5d6)}k2",
      [8, 1, 4, 1, 1, 6, 1, 5, 3],
      "{[8, 1d, 4d, 1d]*(2+[1d, 6, 1d, 5d, 3d])} = 64",
    ],
    [
      "{4d6+2d8-3d30}d3",
      [3, 5, 3, 2, 7, 4, 2, 14, 7],
      "{[3d, 5, 3, 2d]+[7, 4]-[2d, 14, 7]} = -2",
    ],
    ["{3d20+5}>40", [11, 7, 19], "{([11, 7, 19]+5)*} = 1"],
    ["{4d10}>40", [4, 5, 1, 3], "{[4, 5, 1, 3]} = 0"],
    ["{3d10+5}>30f<15", [5, 3, 1], "{([5, 3, 1]+5)_} = -1"],
    [
      "{4d6+2d8, 3d20+3, 5d10+1}>40f<30",
      [4, 3, 3, 2, 2, 6, 17, 5, 20, 7, 9, 6, 10, 8],
      "{([4, 3, 3, 2]+[2, 6])_, ([17, 5, 20]+3)*, ([7, 9, 6, 10, 8]+1)*} = 1",
    ],
    ["{4d6+4}s", [4, 3, 5, 1], "{[1, 3, 4, 5]+4} = 17"],
    [
      "{4d6/2, 3d4+5, 2d10}sd",
      [4, 3, 5, 1, 3, 2, 4, 8, 4],
      "{[4, 3, 2]+5, [8, 4], [5, 4, 3, 1]/2} = 32.5",
    ],
    ["{{2d6}k1, 3}", [2, 5], "{{[2d, 5]}, 3} = 8"],
  ])("%s", (notation, rolls, expected) => {
    expect(rollWith(notation, rolls).toString()).toBe(
      `${notation}: ${expected}`,
    );
  });
});

describe("notation and descriptions", () => {
  test("the notation is shown as it was given, with its description", () => {
    expect(rollWith("4d6 [fire]", [1, 2, 3, 4]).toString()).toBe(
      "4d6 [fire]: [1, 2, 3, 4] = 10",
    );
  });

  test("builder rolls show their generated notation", () => {
    expect(
      rollWith(pool(2, 6, { description: "fire" }), [3, 4]).toString(),
    ).toBe("2d6 // fire: [3, 4] = 7");
    expect(rollWith(pool(2, die("range", -2, 3)), [-2, 3]).toString()).toBe(
      "2d{-2...3}: [-2, 3] = 1",
    );
    expect(rollWith(pool(3, die("face", 1, 1, 2)), [0, 1, 2]).toString()).toBe(
      "3d{1,1,2}: [1, 1, 2] = 4",
    );
  });

  test("custom string notation and descriptions are preserved", () => {
    const notation = "2d{ 1, 1, 2 } [damage]";
    const roll = rollWith(notation, [0, 2]);

    expect(roll.notation).toBe(notation);
    expect(roll.description).toMatchObject({ text: "damage", style: "block" });
    expect(roll.toString()).toBe(`${notation}: [1, 2] = 3`);
  });
});

describe("result nodes", () => {
  test("a result node can be presented on its own", () => {
    const roll = rollWith("2d6+3", [3, 4]);

    expect(defaultTextPresenter.present(roll.result)).toBe("[3, 4]+3");
    expect(
      defaultTextPresenter.present(
        roll.result.type === "binary" ? roll.result.left : roll.result,
      ),
    ).toBe("[3, 4]");
  });
});

describe("conditional results", () => {
  test.each([
    [
      conditional(2, astBinary("+", conditionReference(), 3), pool(1, 6)),
      [],
      "(condition: 2 = 2, true: $$condition+3)",
    ],
    [
      conditional(0, pool(1, 6), conditionReference()),
      [],
      "(condition: 0 = 0, false: $$condition)",
    ],
    [
      conditional(pool(1, 6), null, 9),
      [3],
      "(condition: [3] = 3, true: $$condition)",
    ],
    [conditional(0, null, 9), [], "(condition: 0 = 0, false: 9)"],
    [
      conditional(
        2,
        astBinary(
          "+",
          conditional(
            astBinary("-", conditionReference(), 1),
            conditionReference(),
            0,
          ),
          conditionReference(),
        ),
        0,
      ),
      [],
      "(condition: 2 = 2, true: (condition: $$condition-1 = 1, true: $$condition)+$$condition)",
    ],
    [
      astBinary("*", conditional(2, 3, 4), 5),
      [],
      "(condition: 2 = 2, true: 3)*5",
    ],
  ] as [ExpressionNode, number[], string][])(
    "presents the evaluated conditional %#",
    (node, draws, expected) => {
      const roll = rollWith(node, draws);
      expect(defaultTextPresenter.present(roll.result)).toBe(expected);
      expect(defaultTextPresenter.present(roll)).toBe(
        `${roll.notation}: ${expected} = ${roll.total}`,
      );
    },
  );

  test("shows a deterministic target check value once without reevaluating", () => {
    const notation = "(2d6>=5) ? (4d10+$$condition) : (0)";
    const settings = new RollSettings();
    const draws = [2, 5, 3, 10, 2, 3];
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockImplementation((min) => draws.shift() ?? min);
    const roll = new Roll(notation, settings);
    const result = roll.result;

    expect(roll.toString()).toBe(
      `${notation}: (condition: [2, 5*] = 1, true: [3, 10, 2, 3]+$$condition) = 19`,
    );
    expect(roll.result).toBe(result);
    expect(roll.total).toBe(19);
    expect(integer).toHaveBeenCalledTimes(6);
    expect(roll.toString()).toBe(
      `${notation}: (condition: [2, 5*] = 1, true: [3, 10, 2, 3]+$$condition) = 19`,
    );
    expect(integer).toHaveBeenCalledTimes(6);
  });

  test("histories and subclasses present conditionals without drawing again", () => {
    class FixedPresenter extends TextPresenter {
      protected override formatNumber(value: number): string {
        return value.toFixed(1);
      }
    }

    const settings = settingsWith([3, 4]);
    const integer = jest.spyOn(settings.generator, "integer");
    const roll = new Roll(
      conditional(pool(1, 6), conditionReference(), pool(1, 6)),
      settings,
    );
    const history = new RollHistory();
    history.add(roll);
    const presenter = new FixedPresenter();

    expect(presenter.present(history)).toBe(
      `${roll.notation}: (condition: [3.0] = 3.0, true: $$condition) = 3.0`,
    );
    expect(presenter.present(history)).toBe(
      `${roll.notation}: (condition: [3.0] = 3.0, true: $$condition) = 3.0`,
    );
    expect(integer).toHaveBeenCalledTimes(1);
  });

  test.each([
    [
      pool(conditional(pool(1, 4), 2, 3), 6),
      [1, 4, 5],
      "(qty: (condition: [1] = 1, true: 2) = 2) -> [4, 5]",
    ],
    [
      pool(conditional(1, pool(1, 4), 3), 6),
      [2, 4, 5],
      "(qty: (condition: 1 = 1, true: [2]) = 2) -> [4, 5]",
    ],
    [
      pool(1, conditional(0, 3, pool(1, 6))),
      [4, 3],
      "(sides: (condition: 0 = 0, false: [4]) = 4) -> [3]",
    ],
    [pool(conditional(1, 2, pool(1, 4)), 6), [4, 5], "[4, 5]"],
    [pool(1, conditional(1, 6, pool(1, 6))), [4], "[4]"],
    [pool(conditional(2, conditionReference(), 3), 6), [4, 5], "[4, 5]"],
    [
      pool(conditional(1, conditional(0, 3, pool(1, 4)), 4), 6),
      [2, 4, 5],
      "(qty: (condition: 1 = 1, true: (condition: 0 = 0, false: [2])) = 2) -> [4, 5]",
    ],
    [
      pool(conditional(1, conditional(0, pool(1, 4), 2), 4), 6),
      [4, 5],
      "[4, 5]",
    ],
  ] as [ExpressionNode, number[], string][])(
    "detects evaluated dice in pool parameters %#",
    (node, draws, expected) => {
      const roll = rollWith(node, draws);
      expect(
        new TextPresenter({ expandInlineRolls: true }).present(roll.result),
      ).toBe(expected);
    },
  );

  test("expands stored pool modifier argument rolls without changing default output", () => {
    const settings = new RollSettings();
    const draws = [1, 6, 3, 2];
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockImplementation((min) => draws.shift() ?? min);
    const roll = new Roll("3d6kh(d4)", settings);
    const calls = integer.mock.calls.length;

    expect(roll.toString()).toBe("3d6kh(d4): [1d, 6, 3] = 9");
    expect(
      new TextPresenter({ expandInlineRolls: true }).present(roll.result),
    ).toBe("(keep-high qty: ([2]) = 2) -> [1d, 6, 3]");
    expect(
      new TextPresenter({ expandInlineRolls: true }).present(roll.result),
    ).toBe("(keep-high qty: ([2]) = 2) -> [1d, 6, 3]");
    expect(integer).toHaveBeenCalledTimes(calls);
  });

  test("does not expand computed modifier arguments without dice", () => {
    const roll = rollWith("3d6kh(2)", [1, 6, 3]);

    expect(
      new TextPresenter({ expandInlineRolls: true }).present(roll.result),
    ).toBe(new TextPresenter().present(roll.result));
  });

  test("expands a group whose computed modifier is its only dice", () => {
    const roll = rollWith("{1,2}dl(d2)", [1]);

    expect(
      new TextPresenter({ expandInlineRolls: true }).present(roll.result),
    ).toContain("drop-low qty: ([1]) = 1");
  });

  test("expands stored group modifier argument rolls", () => {
    const roll = rollWith("{d6,d6}kh(d2)", [2, 6, 1]);

    expect(
      new TextPresenter({ expandInlineRolls: true }).present(roll.result),
    ).toBe("(keep-high qty: ([1]) = 1) -> {([2])d, [6]}");
  });

  test("presents a system reference on its own without changing its value", () => {
    const roll = rollWith(conditional(2, conditionReference(), 0));

    expect(roll.result.type).toBe("conditional");
    if (roll.result.type !== "conditional") {
      throw new Error("Expected a conditional result");
    }
    expect(defaultTextPresenter.present(roll.result.selectedResult)).toBe(
      "$$condition",
    );
    expect(roll.result.selectedResult).toMatchObject({
      type: "reference",
      node: { namespace: "system", path: ["condition"] },
      value: 2,
    });
  });
});

describe("comparison results", () => {
  test.each(["=", "!=", "<>", "<", ">", "<=", ">="] as const)(
    "renders the %s operator",
    (op) => {
      const roll = rollWith(comparison(op, 2, 3));
      expect(defaultTextPresenter.present(roll.result)).toBe(`2${op}3`);
      expect(defaultTextPresenter.present(roll)).toBe(
        `${roll.notation}: 2${op}3 = ${roll.total}`,
      );
    },
  );

  test.each<[ExpressionNode, string]>([
    [comparison("=", comparison("<", 1, 2), 1), "(1<2)=1"],
    [comparison("<", 1, comparison(">", 3, 2)), "1<(3>2)"],
    [comparison("=", paren(comparison("<", 1, 2)), 1), "(1<2)=1"],
    [comparison(">", astBinary("+", 1, 2), astBinary("*", 2, 3)), "1+2>2*3"],
    [astBinary("+", comparison("<", 1, 2), 3), "(1<2)+3"],
    [astBinary("*", 3, comparison("<", 1, 2)), "3*(1<2)"],
    [negate(comparison("<", 1, 2)), "-(1<2)"],
    [fn("max", comparison("<", 1, 2), 3), "max(1<2,3)"],
    [group([comparison("<", 1, 2), comparison(">", 3, 2)]), "{1<2, 3>2}"],
    [
      conditional(comparison("<", 1, 2), comparison("=", 2, 2), 0),
      "(condition: 1<2 = 1, true: 2=2)",
    ],
  ])("formats nested comparisons %#", (node, expected) => {
    expect(defaultTextPresenter.present(rollWith(node).result)).toBe(expected);
  });

  test.each<[ExpressionNode, number[], string]>([
    [
      pool(comparison(">", pool(1, 4), 1), 6),
      [2, 5],
      "(qty: [2]>1 = 1) -> [5]",
    ],
    [
      pool(comparison("<", 1, pool(1, 4)), 6),
      [2, 5],
      "(qty: 1<[2] = 1) -> [5]",
    ],
    [
      pool(1, comparison(">", pool(1, 4), 1)),
      [2, 1],
      "(sides: [2]>1 = 1) -> [1]",
    ],
    [
      pool(1, comparison("<", 1, pool(1, 4))),
      [2, 1],
      "(sides: 1<[2] = 1) -> [1]",
    ],
    [pool(comparison("<", 1, 2), 6), [5], "[5]"],
  ])("detects dice in comparison parameters %#", (node, draws, expected) => {
    const roll = rollWith(node, draws);
    expect(
      new TextPresenter({ expandInlineRolls: true }).present(roll.result),
    ).toBe(expected);
  });

  test("presents stored dice through subclasses and histories without rerolling", () => {
    class FixedPresenter extends TextPresenter {
      protected override formatNumber(value: number): string {
        return value.toFixed(1);
      }
    }

    const settings = settingsWith([4, 2, 1]);
    const integer = jest.spyOn(settings.generator, "integer");
    const roll = new Roll(comparison(">", pool(1, 6), pool(1, 6)), settings);
    const history = new RollHistory();
    history.add(roll);
    const presenter = new FixedPresenter();
    const expected = `${roll.notation}: [4.0]>[2.0] = 1.0`;

    expect(presenter.present(history)).toBe(expected);
    expect(presenter.present(history)).toBe(expected);
    expect(integer).toHaveBeenCalledTimes(2);
  });

  test("allows comparison hooks to be overridden", () => {
    class CustomPresenter extends TextPresenter {
      protected override comparison(result: ComparisonResult): string {
        return `compare(${this.visit(result.left)},${this.visit(result.right)})`;
      }
    }

    expect(
      new CustomPresenter().present(rollWith(comparison("<", 1, 2)).result),
    ).toBe("compare(1,2)");
  });

  test("repeated inline comparison expansion does not draw again", () => {
    const settings = settingsWith([2, 5]);
    const integer = jest.spyOn(settings.generator, "integer");
    const roll = new Roll(pool(comparison("<", 1, pool(1, 4)), 6), settings);
    const presenter = new TextPresenter({ expandInlineRolls: true });

    expect(presenter.present(roll.result)).toBe("(qty: 1<[2] = 1) -> [5]");
    expect(presenter.present(roll.result)).toBe("(qty: 1<[2] = 1) -> [5]");
    expect(integer).toHaveBeenCalledTimes(2);
  });
});

describe("builder expression precedence", () => {
  test.each<[string, ExpressionNode, number[], string, number]>([
    [
      "nested addition inside multiplication",
      astBinary("*", astBinary("+", 2, 3), 4),
      [],
      "(2+3)*4",
      20,
    ],
    [
      "negating a compound expression",
      negate(astBinary("+", 2, 3)),
      [],
      "-(2+3)",
      -5,
    ],
    [
      "subtraction on the right",
      astBinary("-", 8, astBinary("-", 3, 1)),
      [],
      "8-(3-1)",
      6,
    ],
    [
      "division on the right",
      astBinary("/", 16, astBinary("/", 4, 2)),
      [],
      "16/(4/2)",
      8,
    ],
    [
      "modulo on the right",
      astBinary("%", 17, astBinary("%", 5, 3)),
      [],
      "17%(5%3)",
      1,
    ],
    [
      "left-associated exponentiation",
      astBinary("^", astBinary("^", 2, 3), 2),
      [],
      "(2^3)^2",
      64,
    ],
    [
      "right-associated exponentiation",
      astBinary("^", 2, astBinary("^", 3, 2)),
      [],
      "2^3^2",
      512,
    ],
    ["a negative exponent", astBinary("^", 2, -1), [], "2^-1", 0.5],
    [
      "dice and modifier flags inside a grouped expression",
      astBinary(
        "*",
        astBinary("+", pool(2, 6, { modifiers: [keep("h")] }), 2),
        3,
      ),
      [6, 2],
      "(2d6kh1+2)*3",
      24,
    ],
    [
      "explicit parentheses",
      astBinary("*", paren(astBinary("+", 2, 3)), astBinary("+", 4, 5)),
      [],
      "(2+3)*(4+5)",
      45,
    ],
  ])("%s", (_description, expression, rolls, notation, total) => {
    const roll = rollWith(expression, rolls);
    const expectedResult = notation.replaceAll("2d6kh1", "[6, 2d]");

    expect(roll.toString()).toBe(`${notation}: ${expectedResult} = ${total}`);
    expect(defaultTextPresenter.present(roll.result)).toBe(expectedResult);
  });
});

describe("options", () => {
  test.each<[string, number[], string]>([
    ["(d4)d10", [2, 3, 4], "(d4)d10: (qty: ([2]) = 2) -> [3, 4] = 7"],
    ["3d(d6)", [4, 3, 2, 1], "3d(d6): (sides: ([4]) = 4) -> [3, 2, 1] = 6"],
    [
      "(d4)d(d6)",
      [2, 4, 3, 1],
      "(d4)d(d6): (qty: ([2]) = 2, sides: ([4]) = 4) -> [3, 1] = 4",
    ],
    [
      "(max(d4,2))d6",
      [3, 1, 2, 3],
      "(max(d4,2))d6: (qty: (max([3],2)) = 3) -> [1, 2, 3] = 6",
    ],
    [
      "({d4+1,d6}kh1)d8",
      [3, 5, 4],
      "({d4+1,d6}kh1)d8: (qty: ({([3]+1)d, [5]}) = 5) -> [4, 1, 1, 1, 1] = 8",
    ],
    [
      "((d4)d6)d10",
      [2, 3, 4],
      "((d4)d6)d10: (qty: ((qty: ([2]) = 2) -> [3, 4]) = 7) -> [1, 1, 1, 1, 1, 1, 1] = 7",
    ],
    ["(d4-1)d6", [1], "(d4-1)d6: (qty: ([1]-1) = 0) -> [] = 0"],
  ])("expands dice in the %s parameter", (notation, rolls, expected) => {
    const presenter = new TextPresenter({ expandInlineRolls: true });

    expect(presenter.present(rollWith(notation, rolls))).toBe(expected);
  });

  test("detects unary dice in a calculated quantity", () => {
    const quantity = astBinary("+", negate(pool(1, 4)), 5);
    const roll = rollWith(pool(quantity, 10), [2, 1, 3, 7]);

    expect(roll.toString()).toBe("(-d4+5)d10: [1, 3, 7] = 11");
    expect(new TextPresenter({ expandInlineRolls: true }).present(roll)).toBe(
      "(-d4+5)d10: (qty: -[2]+5 = 3) -> [1, 3, 7] = 11",
    );
  });

  test("numeric-only parameters retain their ordinary output", () => {
    const roll = rollWith("(2+2*2)d10", [1, 2, 3, 4, 5, 6]);

    expect(new TextPresenter({ expandInlineRolls: true }).present(roll)).toBe(
      roll.toString(),
    );
  });

  test("expansion is disabled by default and can be disabled explicitly", () => {
    const roll = rollWith("(d4)d10", [2, 3]);

    expect(roll.toString()).toBe("(d4)d10: [3, 1] = 4");
    expect(new TextPresenter({ expandInlineRolls: false }).present(roll)).toBe(
      roll.toString(),
    );
  });

  test("repeated expansion presents stored results without drawing again", () => {
    const settings = new RollSettings();
    const draws = [2, 3, 4];
    const integer = jest
      .spyOn(settings.generator, "integer")
      .mockImplementation(() => draws.shift() ?? 1);
    const roll = new Roll("(d4)d10", settings);
    const presenter = new TextPresenter({ expandInlineRolls: true });

    expect(presenter.present(roll)).toBe(
      "(d4)d10: (qty: ([2]) = 2) -> [3, 4] = 7",
    );
    expect(presenter.present(roll)).toBe(
      "(d4)d10: (qty: ([2]) = 2) -> [3, 4] = 7",
    );
    expect(integer).toHaveBeenCalledTimes(3);
  });

  test("target markers follow the absolute calculationValue after a later custom handler", () => {
    const modifiers = new ModifierRegistry().register({
      ...maxHandler,
      order: 20,
      apply: (items) =>
        items.map((item) => ({ ...item, calculationValue: -9 })),
    });
    const settings = new RollSettings({ modifiers });
    jest.spyOn(settings.generator, "integer").mockReturnValue(10);
    expect(new Roll("d10>=8:3max10", settings).toString()).toBe(
      "d10>=8:3max10: [10*********] = -9",
    );
  });

  test("failure markers follow a positive calculationValue", () => {
    const modifiers = new ModifierRegistry().register({
      ...maxHandler,
      order: 20,
      apply: (items) => items.map((item) => ({ ...item, calculationValue: 2 })),
    });
    const settings = new RollSettings({ modifiers });
    jest.spyOn(settings.generator, "integer").mockReturnValue(1);
    const presenter = new TextPresenter({
      flagSymbols: { "target-failure": "no" },
    });

    expect(
      presenter.present(new Roll("d10>=2f=1:3max10", settings).result),
    ).toBe("[1nono]");
  });

  test("target markers disappear when calculationValue is zero", () => {
    const modifiers = new ModifierRegistry().register({
      ...maxHandler,
      order: 20,
      apply: (items) => items.map((item) => ({ ...item, calculationValue: 0 })),
    });
    const settings = new RollSettings({ modifiers });
    jest.spyOn(settings.generator, "integer").mockReturnValue(10);

    expect(new Roll("d10>=8:3max10", settings).toString()).toBe(
      "d10>=8:3max10: [10] = 0",
    );
  });

  test("weighted target flags repeat custom symbols independently of critical flags", () => {
    const presenter = new TextPresenter({
      flagSymbols: { "target-success": "ok", "target-failure": "no" },
    });
    expect(
      presenter.present(rollWith("2d10>=8:2f=1:3cs=10cf=1", [10, 1])),
    ).toBe("2d10>=8:2f=1:3cs=10cf=1: [10okokcs, 1nononocf] = -1");
    expect(rollWith("{d10,d10}>=8:2", [10, 1]).toString()).toBe(
      "{d10,d10}>=8:2: {([10])**, [1]} = 2",
    );
  });

  test("flag symbols can be overridden", () => {
    const presenter = new TextPresenter({
      flagSymbols: { drop: "x", explode: "*" },
    });

    expect(presenter.present(rollWith("3d6!kh2", [6, 1, 2, 3]))).toBe(
      // the 6 explodes into a 3, straight after it
      "3d6!kh2: [6*, 3, 1x, 2x] = 9",
    );
  });

  test("a subclass can change the formatting", () => {
    class BracketsPresenter extends TextPresenter {
      protected override pool(result: PoolResult): string {
        return `<${result.rolls.map((roll) => this.die(roll, result)).join(" ")}>`;
      }

      protected override formatNumber(value: number): string {
        return value.toFixed(1);
      }
    }

    expect(new BracketsPresenter().present(rollWith("2d6+1", [3, 4]))).toBe(
      "2d6+1: <3.0 4.0>+1.0 = 8.0",
    );
  });
});

describe("histories", () => {
  test("rolls are joined with the separator", () => {
    const history = new RollHistory();

    history.add(rollWith("2d6", [3, 4]), rollWith("1d4+1", [2]));

    expect(history.toString()).toBe("2d6: [3, 4] = 7; 1d4+1: [2]+1 = 3");
    expect(new TextPresenter({ separator: "\n" }).present(history)).toBe(
      "2d6: [3, 4] = 7\n1d4+1: [2]+1 = 3",
    );
  });

  test("an empty history is an empty string", () => {
    expect(new RollHistory().toString()).toBe("");
    expect(String(new Roller())).toBe("");
  });
});

describe("default and custom presenters", () => {
  const custom = { present: () => "custom" };

  test("toString() always uses the default presenter", () => {
    const roller = new Roller({ presenter: custom });
    const roll = roller.roll("4");

    expect(roll.toString()).toBe("4: 4 = 4");
    expect(String(roller)).toBe("4: 4 = 4");
    expect(roller.history.toString()).toBe("4: 4 = 4");
  });

  test("present() uses the configured presenter, or the given one", () => {
    const roller = new Roller({ presenter: custom });
    const roll = roller.roll("4");

    expect(roll.present()).toBe("custom");
    expect(roller.present()).toBe("custom");
    expect(roll.present(defaultTextPresenter)).toBe("4: 4 = 4");
    expect(roller.present(defaultTextPresenter)).toBe("4: 4 = 4");
    expect(roller.history.present()).toBe("4: 4 = 4");
  });

  test("re-rolls keep the configured presenter", () => {
    const roll = new Roll("4", { presenter: custom });

    expect(roll.reroll().present()).toBe("custom");
  });
});
