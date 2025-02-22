import { ExpressionResult } from "../../Interfaces/Results/ExpressionResult";
import { ResultCollection } from "../../Interfaces/Results/ResultCollection";
import { SingleResult } from "../../Interfaces/Results/SingleResult";

export type RollsImport = ExpressionResult
  | ResultCollection
  | (ExpressionResult|ResultCollection|SingleResult|number|string)[]
  | (ExpressionResult|ResultCollection|SingleResult|number|string)[][];
