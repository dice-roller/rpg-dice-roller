import { Stringable } from '../Stringable';
import { Nameable } from '../Nameable';
import { HasNotation } from '../HasNotation';
import { ModifierJsonOutput } from '../Json/ModifierJsonOutput';
import { CanModify } from "../CanModify";

export interface Modifier extends CanModify, Readonly<HasNotation>, Readonly<Nameable>, Stringable {
  readonly maxIterations: number;

  toJSON(): ModifierJsonOutput;
}
