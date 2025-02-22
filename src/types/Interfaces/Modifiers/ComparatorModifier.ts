import { Modifier } from "./Modifier";
import { Comparator } from "../Comparator";

export interface ComparatorModifier extends Modifier {
  // @todo rename this to `comparator`
  comparePoint: Comparator|null;

  // @todo rename this
  isComparePoint(value: number): boolean;
}
