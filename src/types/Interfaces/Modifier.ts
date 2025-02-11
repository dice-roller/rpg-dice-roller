import RollResults from "../../results/RollResults";
import { ModelType } from "../Enums/ModelType";
import { Stringable } from "./Stringable";
import {Modifiable} from "./Modifiable";

export interface Modifier extends Stringable {
  readonly maxIterations: number;
  readonly name: string;
  readonly notation: string;
  readonly order: number;

  run(results: RollResults, context: Modifiable): RollResults;
  toJSON(): {
    name: string;
    notation: string;
    type: typeof ModelType.Modifier;
  };
}
