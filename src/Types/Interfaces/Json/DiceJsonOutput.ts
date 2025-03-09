import { JsonOutput } from "./JsonOutput";
import { ModifierCollection } from "../../Types/ModifierCollection";
import { DescriptionJsonOutput } from "./DescriptionJsonOutput";

export interface DiceJsonOutput extends DescriptionJsonOutput, JsonOutput {
  average: number,
  max: number,
  min: number,
  // @todo this should be a plan object / array
  modifiers: ModifierCollection,
  notation: string,
  qty: number,
  sides: number|string,
}
