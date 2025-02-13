import { ComparisonOperator } from "../Enums/ComparisonOperator";

export interface Comparator {
  operator: ComparisonOperator;
  value: number;

  isMatch(value: number): boolean;
}
