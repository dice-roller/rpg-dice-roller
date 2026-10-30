import {
  DiceRollerError,
  EvaluationError,
  ImportError,
  NotationError,
  ValidationError,
} from "../src/errors/index.js";
import { NotImplementedError } from "../src/errors/NotImplementedError.js";

describe("errors", () => {
  test.each([
    ["EvaluationError", new EvaluationError("x")],
    ["ImportError", new ImportError("x")],
    ["NotationError", new NotationError("x", "4d")],
    ["NotImplementedError", new NotImplementedError("x")],
    ["ValidationError", new ValidationError("x")],
  ])("%s extends DiceRollerError and is named", (name, error) => {
    expect(error).toBeInstanceOf(DiceRollerError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
  });

  test("NotationError keeps the notation and location", () => {
    const location = { offset: 2, line: 1, column: 3 };
    const error = new NotationError("bad", "4d", location);

    expect(error.notation).toBe("4d");
    expect(error.location).toEqual(location);
  });

  test("NotImplementedError names the feature", () => {
    expect(new NotImplementedError("Evaluator.evaluate").message).toBe(
      "Evaluator.evaluate is not implemented yet",
    );
  });
});
