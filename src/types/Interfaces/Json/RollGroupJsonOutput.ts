import { JsonOutput } from "./JsonOutput";
import { ExpressionCollection } from "../../Types/ExpressionCollection";
import Description from "../../../Description";
import { ModifierCollection } from "../../Types/ModifierCollection";

export interface RollGroupJsonOutput extends JsonOutput {
  description: Description|null;
  expressions: ExpressionCollection[];
  modifiers: ModifierCollection;
  notation: string;
}
