import { ResultCollection } from "./ResultCollection";
import { JsonSerializable } from "../JsonSerializable";
import { Stringable } from "../Stringable";
import { ResultValue } from "./ResultValue";
import { RollResult } from "../../Types/RollResult";
import { ExpressionResultJsonOutput } from "../Json/ExpressionResultJsonOutput";

export interface ExpressionResult extends JsonSerializable, Omit<ResultValue, 'initialValue'>, Stringable {
  readonly length: number;
  readonly modifierFlags: string;
  readonly value: number;

  isRollGroup: boolean;
  results: RollResult[];

  addResult(value: ExpressionResult | ResultCollection | number | string): void;

  toJSON(): ExpressionResultJsonOutput;
}
