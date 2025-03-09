import { JsonOutput } from "./JsonOutput";
import { RollResultJsonOutput } from "../../Types/Json/RollResultJsonOutput";

export interface DiceRollJsonOutput extends Partial<JsonOutput> {
  averageTotal?: number;
  maxTotal?: number;
  minTotal?: number;
  notation: string;
  output?: string;
  rolls?: RollResultJsonOutput[];
  total?: number;
}
