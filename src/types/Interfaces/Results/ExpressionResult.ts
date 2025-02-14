import { ResultCollection } from "./ResultCollection";
import { JsonSerializable } from "../JsonSerializable";
import { Stringable } from "../Stringable";
import { ResultValue } from "./ResultValue";

export interface ExpressionResult extends JsonSerializable, Omit<ResultValue, 'initialValue'>, Stringable {
  readonly length: number;
  readonly modifierFlags: string;
  readonly value: number;

  isRollGroup: boolean;
  results: Array<ExpressionResult|ResultCollection|number|string>;

  addResult(value: ExpressionResult | ResultCollection | number | string): void;
}
