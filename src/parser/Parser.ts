import type { ExpressionNode } from "../ast/nodes.js";
import { NotationError } from "../errors/NotationError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { DEFAULT_ROLL_LIMITS } from "../evaluator/RollContext.js";
import * as grammar from "./generated/grammar.js";

/** Options for parsing notation. */
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
  /** Maximum literal pool quantity accepted by the grammar. */
  readonly maxQty: number;

  /** Creates a parser with the supplied literal quantity limit. */
  constructor(options: ParserOptions = {}) {
    this.maxQty = options.maxQty ?? DEFAULT_ROLL_LIMITS.maxQty;
  }

  /**
   * Parses a notation string into an expression tree without rolling any dice.
   *
   * Literal pool quantities are checked against `maxQty`; evaluated quantities are checked
   * separately by the evaluator's roll limits.
   *
   * @throws {ValidationError} the notation is empty or not a string
   * @throws {NotationError} the notation is invalid, with its source location and syntax error cause
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
