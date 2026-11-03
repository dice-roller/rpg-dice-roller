import {
  binary as astBinary,
  die,
  keep,
  negate,
  paren,
  pool,
} from "../../src/ast/builders.js";
import type { ExpressionNode } from "../../src/ast/nodes.js";
import {
  TextPresenter,
  defaultTextPresenter,
} from "../../src/presenters/TextPresenter.js";
import type { PoolResult } from "../../src/results/types.js";
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
    ["3d6cs>3cf<3", [5, 4, 1], "3d6cs>3cf<3: [5**, 4**, 1__] = 10"],
    ["4d6sd", [1, 4, 6, 5], "4d6sd: [6, 5, 4, 1] = 16"],
    ["2d6r<=4", [3, 5, 6], "2d6r<=4: [6r, 5] = 11"],
    ["2d6ro", [1, 5, 1], "2d6ro: [1ro, 5] = 6"],
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
    ["2d20cs", [4, 20], "2d20cs: [4, 20**] = 24"],
    ["2d20cf", [4, 1], "2d20cf: [4, 1__] = 5"],
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
      "2drange(-2, 3): [-2, 3] = 1",
    );
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
