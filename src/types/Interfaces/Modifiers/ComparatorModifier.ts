import { Modifier } from "./Modifier";
import { Comparator } from "../Comparator";

export interface ComparatorModifier extends Modifier {
  // @todo rename this to `comparator`
  comparePoint: Comparator|undefined;

  // @todo rename this
  isComparePoint(value: number):boolean;
}
