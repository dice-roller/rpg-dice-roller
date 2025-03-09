import { JsonOutput } from "./JsonOutput";
import { DescriptionJsonOutput } from "./DescriptionJsonOutput";
import { ModifierCollectionJsonOutput } from "../../Types/Json/ModifierCollectionJsonOutput";
import { DiceJsonOutput } from "./DiceJsonOutput";

export interface RollGroupJsonOutput extends DescriptionJsonOutput, JsonOutput {
  expressions: (DiceJsonOutput|string|number)[][];
  modifiers: ModifierCollectionJsonOutput;
  notation: string;
}
