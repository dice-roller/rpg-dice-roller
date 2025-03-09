import { ResultCollection } from "./ResultCollection";
import { JsonSerializable } from "../JsonSerializable";
import { Stringable } from "../Stringable";
import { ResultValue } from "./ResultValue";
import { RollResultType } from "../../Types/RollResultType";
import { ExpressionResultJsonOutput } from "../Json/ExpressionResultJsonOutput";

export interface ExpressionResult extends JsonSerializable, Omit<ResultValue, 'initialValue'>, Stringable {
  readonly length: number;
  readonly modifierFlags: string;
  readonly value: number;

  isRollGroup: boolean;
  results: RollResultType[];

  addResult(value: ExpressionResult | ResultCollection | number | string): void;

  toJSON(): ExpressionResultJsonOutput;
}
