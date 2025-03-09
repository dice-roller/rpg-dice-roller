import { ExpressionResult } from "./Results/ExpressionResult";
import { ResultCollection } from "./Results/ResultCollection";
import { Modifiable } from "./Modifiable";

export interface CanModify {
  order?: number;
  run<T extends ExpressionResult | ResultCollection>(results: T, _context?: Modifiable): T;
}
