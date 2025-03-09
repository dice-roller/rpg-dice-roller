import { ModelType } from "../../Enums/ModelType";
import { RollResultJsonOutput } from "../../Types/Json/RollResultJsonOutput";

export interface ExpressionResultJsonOutput {
  calculationValue: number;
  isRollGroup: boolean;
  modifierFlags: string;
  modifiers: string[];
  results: RollResultJsonOutput[];
  type: ModelType;
  useInTotal: boolean;
  value: number;
}
