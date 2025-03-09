import { ExpressionResult } from "../Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../Interfaces/Results/ResultCollection";

export type RollResultType = ExpressionResult
  | ResultCollection
  | number
  | string;
