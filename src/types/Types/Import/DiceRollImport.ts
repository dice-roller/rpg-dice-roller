import { DiceRollJsonOutput } from "../../Interfaces/Json/DiceRollJsonOutput";
import DiceRoll from "../../../DiceRoll";
import { RollsImport } from "./RollsImport";

export type DiceRollImport = DiceRoll
  | DiceRollJsonOutput
  | Omit<DiceRollJsonOutput, 'rolls'> & {
    rolls?: RollsImport;
  }
  | string;
