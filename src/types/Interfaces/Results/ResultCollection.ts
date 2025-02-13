import { Stringable } from "../Stringable";
import { JsonSerializable } from "../JsonSerializable";
import { Result } from "./Result";

// @todo reconsider names of variables
export interface ResultCollection extends JsonSerializable, Stringable {
  readonly length: number;
  readonly value: number;

  rolls: Result[];

  // @todo this could return `self` for chaining
  addRoll(roll: Result|number): void;
}
