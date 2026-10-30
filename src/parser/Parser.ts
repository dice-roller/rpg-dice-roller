import type { ExpressionNode } from "../ast/nodes.js";
import { NotationError } from "../errors/NotationError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { DEFAULT_ROLL_LIMITS } from "../evaluator/RollContext.js";
import * as grammar from "./generated/grammar.js";

export interface ParserOptions {
  /** The maximum literal quantity of a dice pool (default `999`). */
  maxQty?: number;
}

/**
 * Parses dice notation into the AST.
 *
 * @see https://dice-roller.github.io/documentation/guide/notation/
 */
export class Parser {
  readonly maxQty: number;

  constructor(options: ParserOptions = {}) {
    this.maxQty = options.maxQty ?? DEFAULT_ROLL_LIMITS.maxQty;
  }

  /**
   * @throws {ValidationError} the notation is empty or not a string
   * @throws {NotationError} the notation is invalid
   */
  parse(notation: string): ExpressionNode {
    if (typeof notation !== "string") {
      throw new ValidationError("Notation must be a string");
    }

    if (notation === "") {
      throw new ValidationError("Notation is required");
    }

    try {
      return grammar.parse(notation, { maxQty: this.maxQty });
    } catch (error) {
      if (error instanceof grammar.SyntaxError) {
        const { offset, line, column } = error.location.start;

        throw new NotationError(
          `Invalid notation "${notation}": ${error.message}`,
          notation,
          { offset, line, column },
          { cause: error },
        );
      }

      throw error;
    }
  }
}
