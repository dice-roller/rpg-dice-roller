import { createDie, createNumber } from "../../src/ast/factory.js";
import { NotImplementedError } from "../../src/errors/NotImplementedError.js";
import {
  DEFAULT_FLAG_SYMBOLS,
  TextPresenter,
  TreePresenter,
  defaultTextPresenter,
} from "../../src/presenters/index.js";
import type {
  BinaryResult,
  DieResult,
  ExpressionResult,
  FunctionResult,
  GroupResult,
  NumberResult,
  ParenResult,
  PoolResult,
  UnaryResult,
} from "../../src/results/types.js";
import { Roll } from "../../src/Roll.js";
import { RollHistory } from "../../src/RollHistory.js";

/** Records which hook was called. */
class HookPresenter extends TreePresenter<string> {
  protected history(history: RollHistory): string {
    return `history(${history.rolls.map((roll) => this.roll(roll)).join(", ")})`;
  }
  protected roll(roll: Roll<unknown>): string {
    return `roll(${this.visit(roll.result)})`;
  }
  protected number(result: NumberResult): string {
    return `number(${result.value})`;
  }
  protected pool(result: PoolResult): string {
    return `pool(${result.rolls.map((die) => this.die(die, result)).join(", ")})`;
  }
  protected die(result: DieResult, _pool: PoolResult): string {
    return `die(${result.value})`;
  }
  protected group(): string {
    return "group";
  }
  protected binary(result: BinaryResult): string {
    return `binary(${this.visit(result.left)} ${result.node.op} ${this.visit(result.right)})`;
  }
  protected unary(): string {
    return "unary";
  }
  protected paren(result: ParenResult): string {
    return `paren(${this.visit(result.inner)})`;
  }
  protected fn(): string {
    return "fn";
  }
}

const number = (value: number): NumberResult => ({
  type: "number",
  node: createNumber(value),
  value,
});

const die = (value: number): DieResult => ({
  type: "die",
  value,
  initialValue: value,
  calculationValue: value,
  useInTotal: true,
  flags: [],
});

const pool: PoolResult = {
  type: "pool",
  node: {
    type: "pool",
    qty: createNumber(2),
    die: createDie("standard", [createNumber(6)]),
    modifiers: [],
  },
  value: 7,
  qty: number(2),
  dieArgs: [number(6)],
  die: { notation: "6", min: 1, max: 6, average: 3.5, faceCount: 6 },
  rolls: [die(3), die(4)],
};

const sum: BinaryResult = {
  type: "binary",
  node: {
    type: "binary",
    op: "+",
    left: pool.node,
    right: createNumber(2),
  },
  value: 9,
  left: pool,
  right: number(2),
};

const roll = (result: ExpressionResult) =>
  Roll.fromJSON({
    type: "roll",
    version: 1,
    notation: "2d6+2",
    result,
    total: result.value,
    minTotal: 4,
    maxTotal: 14,
    averageTotal: 9,
  });

describe("TreePresenter", () => {
  const presenter = new HookPresenter();

  test("a history goes to history()", () => {
    const history = new RollHistory();
    history.add(roll(number(1)), roll(number(2)));

    expect(presenter.present(history)).toBe(
      "history(roll(number(1)), roll(number(2)))",
    );
  });

  test("a roll goes to roll()", () => {
    expect(presenter.present(roll(sum))).toBe(
      "roll(binary(pool(die(3), die(4)) + number(2)))",
    );
  });

  test.each<[string, ExpressionResult, string]>([
    ["number", number(4), "number(4)"],
    ["pool", pool, "pool(die(3), die(4))"],
    ["binary", sum, "binary(pool(die(3), die(4)) + number(2))"],
    [
      "paren",
      {
        type: "paren",
        node: { type: "paren", expression: createNumber(4) },
        value: 4,
        inner: number(4),
      } satisfies ParenResult,
      "paren(number(4))",
    ],
    [
      "unary",
      {
        type: "unary",
        node: { type: "unary", op: "-", operand: createNumber(4) },
        value: -4,
        operand: number(4),
      } satisfies UnaryResult,
      "unary",
    ],
    [
      "function",
      {
        type: "function",
        node: { type: "function", name: "abs", args: [createNumber(4)] },
        value: 4,
        args: [number(4)],
      } satisfies FunctionResult,
      "fn",
    ],
    [
      "group",
      {
        type: "group",
        node: { type: "group", expressions: [], modifiers: [] },
        value: 0,
        members: [],
      } satisfies GroupResult,
      "group",
    ],
  ])("a %s result goes to its hook", (_, result, expected) => {
    expect(presenter.present(result)).toBe(expected);
  });

  test("Roll and RollHistory present() with a given presenter", () => {
    const history = new RollHistory();
    history.add(roll(number(1)));

    expect(roll(number(1)).present(presenter)).toBe("roll(number(1))");
    expect(history.present(presenter)).toBe("history(roll(number(1)))");
  });
});

describe("TextPresenter", () => {
  test("flag symbols default to v5 and can be overridden", () => {
    const presenter = new TextPresenter({ flagSymbols: { drop: "x" } });

    expect(presenter.flagSymbols).toEqual({
      ...DEFAULT_FLAG_SYMBOLS,
      drop: "x",
    });
    expect(presenter.separator).toBe("; ");
    expect(new TextPresenter({ separator: "\n" }).separator).toBe("\n");
  });

  test("the hooks are stubs, so toString() is not implemented yet", () => {
    expect(() => defaultTextPresenter.present(number(1))).toThrow(
      NotImplementedError,
    );
    expect(() => String(roll(number(1)))).toThrow(NotImplementedError);
  });
});
