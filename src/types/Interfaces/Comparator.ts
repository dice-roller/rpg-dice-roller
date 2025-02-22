import { ComparisonOperator } from "../Enums/ComparisonOperator";
import { Stringable } from "./Stringable";

export interface Comparator extends Stringable {
  operator: ComparisonOperator;
  value: number;

  isMatch(value: number): boolean;
}
