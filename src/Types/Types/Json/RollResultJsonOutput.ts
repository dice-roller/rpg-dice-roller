import { ResultCollectionJsonOutput } from "../../Interfaces/Json/ResultCollectionJsonOutput";
import { ExpressionResultJsonOutput } from "../../Interfaces/Json/ExpressionResultJsonOutput";

export type RollResultJsonOutput = ExpressionResultJsonOutput
  | ResultCollectionJsonOutput
  | number
  | string;
