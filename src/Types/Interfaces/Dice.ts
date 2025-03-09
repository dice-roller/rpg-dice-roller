import { Stringable } from "./Stringable";
import { JsonSerializable } from "./JsonSerializable";
import { Describable } from "./Describable";
import { Modifiable } from "./Modifiable";
import { HasNotation } from "./HasNotation";
import { Nameable } from "./Nameable";
import { ResultCollection } from "./Results/ResultCollection";
import { SingleResult } from "./Results/SingleResult";
import { DiceJsonOutput } from "./Json/DiceJsonOutput";
import { Rollable } from "./Rollable";

export interface Dice extends
  Describable,
  Readonly<HasNotation>,
  JsonSerializable,
  Modifiable,
  Readonly<Nameable>,
  Readonly<Rollable>,
  Stringable
{
  readonly average: number;
  readonly qty: number;
  readonly sides: number | string;

  roll(): ResultCollection;

  rollOnce(): SingleResult;

  toJSON(): DiceJsonOutput;
}
