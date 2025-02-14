import { Stringable } from "../Stringable";
import { JsonSerializable } from "../JsonSerializable";
import { SingleResult } from "./SingleResult";

// @todo reconsider names of variables
export interface ResultCollection extends JsonSerializable, Stringable {
  readonly length: number;
  readonly value: number;

  rolls: SingleResult[];

  // @todo this could return `self` for chaining
  addRoll(roll: SingleResult|number): void;
}
