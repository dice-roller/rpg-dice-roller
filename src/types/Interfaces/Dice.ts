import RollResults from "../../results/RollResults";
import RollResult from "../../results/RollResult";
import {Stringable} from "./Stringable";
import {JsonSerializable} from "./JsonSerializable";
import {ModelType} from "../Enums/ModelType";
import Description from "../../Description";
import {Describable} from "./Describable";
import {Modifiable} from "./Modifiable";
import {HasNotation} from "./HasNotation";
import {ModifierCollection} from "../Types/ModifierCollection";

export interface Dice extends Describable, HasNotation, JsonSerializable, Modifiable, Stringable {
  readonly average: number;
  readonly max: number,
  readonly min: number,
  readonly name: string,
  readonly qty: number;
  readonly sides: number | string;

  roll(): RollResults;
  rollOnce(): RollResult;
  toJSON(): {
    average: number;
    description: Description|null,
    max: number;
    min: number;
    modifiers: ModifierCollection | null;
    name: string;
    notation: string;
    qty: number;
    sides: number | string;
    type: typeof ModelType.Dice;
  };
}
