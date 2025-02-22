import { ModelType } from "../../Enums/ModelType";

export interface SingleResultJsonOutput {
  calculationValue: number;
  initialValue: number;
  modifierFlags: string,
  modifiers: string[],
  type: ModelType,
  useInTotal: boolean;
  value: number;
}
