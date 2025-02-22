import { ExpressionResult } from "./Results/ExpressionResult";
import { RollResult } from "../Types/RollResult";

// @todo think of better name for this
export interface RollOutputData {
  notation: string;
  rolls: ExpressionResult|RollResult[];
}
