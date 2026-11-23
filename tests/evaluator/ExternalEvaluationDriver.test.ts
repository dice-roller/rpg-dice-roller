import { EvaluationError } from "../../src/errors/EvaluationError.js";
import type { ExpressionNode } from "../../src/ast/nodes.js";
import { AsyncEvaluationDriver } from "../../src/evaluator/AsyncEvaluationDriver.js";
import { Evaluator } from "../../src/evaluator/Evaluator.js";
import { SyncEvaluationDriver } from "../../src/evaluator/SyncEvaluationDriver.js";
import { createRollContext } from "../../src/evaluator/RollContext.js";
import type {
  DrawDieOptions,
  DrawDieRequest,
} from "../../src/evaluator/DrawDieRequest.js";
import {
  createDrawDieRequest,
  type EvaluationDrawRequest,
} from "../../src/evaluator/EvaluationDrawRequest.js";
import { RollSettings } from "../../src/RollSettings.js";
import { ModifierRegistry } from "../../src/modifiers/ModifierRegistry.js";
import type { ScoredItem } from "../../src/results/types.js";
import { Parser } from "../../src/parser/Parser.js";
import { DieRegistry } from "../../src/dice/DieRegistry.js";

const parser = new Parser();
const evaluator = new Evaluator({
  dice: new DieRegistry(),
  modifiers: new ModifierRegistry(),
});

class UncheckedEvaluator extends Evaluator {
  evaluateUnchecked(node: ExpressionNode) {
    const ctx = createRollContext();

    return new SyncEvaluationDriver().evaluate(
      this.evaluateNode(node, ctx),
      ctx,
    );
  }
}

function collectRequests(
  notation: string,
  faces: number[],
): { requests: DrawDieRequest[]; value: number } {
  const evaluation = evaluator.evaluateGenerator(
    parser.parse(notation),
    createRollContext(),
  );
  const requests: DrawDieRequest[] = [];
  let step = evaluation.next();

  while (!step.done) {
    requests.push(createDrawDieRequest(step.value));
    const face = faces.shift();

    if (face === undefined) {
      throw new Error("Not enough test faces supplied");
    }

    step = evaluation.next(face);
  }

  return { requests, value: step.value.value };
}

function context(drawDie: DrawDieOptions) {
  return createRollContext({ drawDie });
}

function standardRequest(sides = 6): DrawDieRequest {
  return {
    notation: String(sides),
    min: 1,
    max: sides,
    factoryName: "standard",
  };
}

describe("evaluation draw requests", () => {
  test.each<[string, number[], DrawDieRequest[]]>([
    ["2d6", [2, 5], [standardRequest(), standardRequest()]],
    [
      "4d6kh3",
      [1, 2, 3, 4],
      Array.from({ length: 4 }, () => standardRequest()),
    ],
    [
      "2d6+d8",
      [1, 2, 3],
      [standardRequest(), standardRequest(), standardRequest(8)],
    ],
  ])(
    "yields each initial draw in order for %s",
    (notation, faces, expected) => {
      const { requests } = collectRequests(notation, [...faces]);

      expect(requests).toEqual(expected);
    },
  );

  test("evaluates computed sides before yielding the die request", () => {
    const { requests, value } = collectRequests("d(2+3)", [4]);

    expect(requests).toEqual([
      { notation: "5", min: 1, max: 5, factoryName: "standard" },
    ]);
    expect(value).toBe(4);
  });

  test("yields the selected conditional branch only", () => {
    const { requests, value } = collectRequests("(1)?(d6):(d8)", [5]);

    expect(requests).toEqual([standardRequest()]);
    expect(value).toBe(5);
  });

  test("exposes the initial request for a pool with an explode modifier", () => {
    const { requests, value } = collectRequests("d6!", [1]);

    expect(requests).toEqual([standardRequest()]);
    expect(value).toBe(1);
  });
});

describe("modifier draw requests", () => {
  test.each<[string, number[], number, number]>([
    ["d6!", [6, 3], 2, 9],
    ["2d6r", [1, 3, 2], 3, 5],
    ["2d6r", [1, 1, 3, 2], 4, 5],
    ["2d6ro", [1, 3, 2], 3, 5],
    ["d6!!p", [6, 6, 2], 3, 12],
    ["4d6u", [1, 1, 2, 2, 3, 4], 6, 10],
    ["4d6!m", [6, 6, 6, 6, 3, 3, 3, 3, 1, 2, 3, 4], 12, 46],
  ])(
    "yields every modifier-generated draw for %s",
    (notation, faces, count, value) => {
      const result = collectRequests(notation, [...faces]);

      expect(result.requests).toHaveLength(count);
      expect(result.requests).toEqual(
        Array.from({ length: count }, () => standardRequest()),
      );
      expect(result.value).toBe(value);
    },
  );
});

describe("evaluation drivers", () => {
  test("the synchronous driver supplies a face and resumes evaluation", () => {
    const callback = jest.fn(() => 6);
    const drawDie: DrawDieOptions = { drawMode: "sync", callback };
    const result = new SyncEvaluationDriver().evaluate(
      evaluator.evaluateGenerator(parser.parse("d6"), context(drawDie)),
      context(drawDie),
    );

    expect(callback).toHaveBeenCalledWith(standardRequest());
    expect(result.value).toBe(6);
  });

  test("the asynchronous driver awaits a face and resumes evaluation", async () => {
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return 4;
    });
    const drawDie: DrawDieOptions = { drawMode: "async", callback };
    const result = await new AsyncEvaluationDriver().evaluate(
      evaluator.evaluateGenerator(parser.parse("d6"), context(drawDie)),
      context(drawDie),
    );

    expect(callback).toHaveBeenCalledWith(standardRequest());
    expect(result.value).toBe(4);
  });

  test("both drivers validate externally supplied faces", async () => {
    const syncDrawDie: DrawDieOptions = {
      drawMode: "sync",
      callback: () => 7,
    };
    const asyncDrawDie: DrawDieOptions = {
      drawMode: "async",
      callback: async () => {
        await Promise.resolve();
        return 7;
      },
    };

    expect(() =>
      new SyncEvaluationDriver().evaluate(
        evaluator.evaluateGenerator(parser.parse("d6"), context(syncDrawDie)),
        context(syncDrawDie),
      ),
    ).toThrow(EvaluationError);
    await expect(
      new AsyncEvaluationDriver().evaluate(
        evaluator.evaluateGenerator(parser.parse("d6"), context(asyncDrawDie)),
        context(asyncDrawDie),
      ),
    ).rejects.toThrow(EvaluationError);
  });

  test("the synchronous driver rejects a Promise-returning callback", () => {
    const drawDie: DrawDieOptions = {
      drawMode: "sync",
      callback: async () => {
        await Promise.resolve();
        return 4;
      },
    };

    expect(() =>
      new SyncEvaluationDriver().evaluate(
        evaluator.evaluateGenerator(parser.parse("d6"), context(drawDie)),
        context(drawDie),
      ),
    ).toThrow(/Promise in sync mode/);
  });

  test("drivers reject a mismatched configured mode", async () => {
    const asyncDrawDie: DrawDieOptions = {
      drawMode: "async",
      callback: async () => {
        await Promise.resolve();
        return 4;
      },
    };
    const syncDrawDie: DrawDieOptions = {
      drawMode: "sync",
      callback: () => 4,
    };

    expect(() =>
      new SyncEvaluationDriver().evaluate(
        evaluator.evaluateGenerator(parser.parse("d6"), context(asyncDrawDie)),
        context(asyncDrawDie),
      ),
    ).toThrow(/asynchronous evaluation driver/);
    await expect(
      new AsyncEvaluationDriver().evaluate(
        evaluator.evaluateGenerator(parser.parse("d6"), context(syncDrawDie)),
        context(syncDrawDie),
      ),
    ).rejects.toThrow(/synchronous evaluation driver/);
  });
});

describe("modifier draws through evaluation drivers", () => {
  test("the synchronous driver supplies faces to generated dice", () => {
    const faces = [6, 3];
    const callback = jest.fn(() => faces.shift() ?? 1);
    const drawDie: DrawDieOptions = { drawMode: "sync", callback };
    const result = new SyncEvaluationDriver().evaluate(
      evaluator.evaluateGenerator(parser.parse("d6!"), context(drawDie)),
      context(drawDie),
    );

    expect(result.value).toBe(9);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenNthCalledWith(1, standardRequest());
    expect(callback).toHaveBeenNthCalledWith(2, standardRequest());
  });

  test("the asynchronous driver awaits faces for generated dice", async () => {
    const faces = [6, 3];
    const callback = jest.fn(async () => {
      await Promise.resolve();
      return faces.shift() ?? 1;
    });
    const drawDie: DrawDieOptions = { drawMode: "async", callback };
    const result = await new AsyncEvaluationDriver().evaluate(
      evaluator.evaluateGenerator(parser.parse("d6!"), context(drawDie)),
      context(drawDie),
    );

    expect(result.value).toBe(9);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test("batch budget exhaustion does not call the external source partially", () => {
    const callback = jest.fn(() => 6);
    const settings = new RollSettings({
      limits: { maxGeneratedRolls: 3 },
      drawDie: { drawMode: "sync", callback },
    });
    const result = settings.evaluate(settings.parse("4d6!m"));

    expect(result.value).toBe(24);
    expect(callback).toHaveBeenCalledTimes(4);
  });
});

describe("evaluation error and fallback paths", () => {
  test.each<[string, unknown]>([
    ["unknown expression node", { type: "unknown" }],
    ["empty group", { type: "group", expressions: [], modifiers: [] }],
    [
      "unknown operator",
      {
        type: "binary",
        op: "unknown",
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      },
    ],
    ["unknown function", { type: "function", name: "unknown", args: [] }],
  ])("rejects an %s", (_, node) => {
    const unchecked = new UncheckedEvaluator(evaluator.registries);

    expect(() => unchecked.evaluateUnchecked(node as ExpressionNode)).toThrow(
      EvaluationError,
    );
  });

  test("the async driver uses the built-in generator when no external source is configured", async () => {
    const ctx = createRollContext();
    const result = await new AsyncEvaluationDriver().evaluate(
      evaluator.evaluateGenerator(parser.parse("d6"), ctx),
      ctx,
    );

    expect(result.value).toBeGreaterThanOrEqual(1);
    expect(result.value).toBeLessThanOrEqual(6);
  });

  test("deterministic async evaluation does not call an external source", async () => {
    const callback = jest.fn(() => 6);
    const ctx = createRollContext({
      mode: "min",
      drawDie: { drawMode: "async", callback },
    });
    const result = await new AsyncEvaluationDriver().evaluate(
      evaluator.evaluateGenerator(parser.parse("d6"), ctx),
      ctx,
    );

    expect(result.value).toBe(1);
    expect(callback).not.toHaveBeenCalled();
  });

  test("rejects a generator handler that does not return an array", () => {
    const modifiers = new ModifierRegistry().register({
      name: "keep",
      order: 7,
      appliesTo: ["pool"],
      *apply<T extends ScoredItem>(): Generator<
        EvaluationDrawRequest,
        T[],
        number
      > {
        yield* [];
        return undefined as unknown as T[];
      },
    });
    const settings = new RollSettings({ modifiers });

    expect(() => settings.evaluate(settings.parse("d6kh1"))).toThrow(
      /handler must return an array/,
    );
  });
});
