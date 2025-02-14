import { ModelType } from "../../Enums/ModelType";
import { Stringable } from "../Stringable";
import {Modifiable} from "../Modifiable";
import { Nameable } from "../Nameable";
import { HasNotation } from "../HasNotation";
import { ResultCollection } from "../Results/ResultCollection";
import { ExpressionResult } from "../Results/ExpressionResult";

export interface Modifier extends Readonly<HasNotation>, Readonly<Nameable>, Stringable {
  readonly maxIterations: number;
  readonly name: string;
  order: number;

  run<T extends ExpressionResult | ResultCollection>(results: T, _context: Modifiable): T;

  toJSON(): {
    name: string;
    notation: string;
    type: ModelType;
  };
}
