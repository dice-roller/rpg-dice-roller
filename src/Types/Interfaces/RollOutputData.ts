import { ExpressionResult } from "./Results/ExpressionResult";
import { RollResultType } from "../Types/RollResultType";

// @todo think of better name for this
export interface RollOutputData {
  notation: string;
  rolls: ExpressionResult|RollResultType[];
}
