import { Stringable } from "../Stringable";
import { JsonSerializable } from "../JsonSerializable";
import { ResultValue } from "./ResultValue";
import { SingleResultJsonOutput } from "../Json/SingleResultJsonOutput";

export interface SingleResult extends JsonSerializable, Required<ResultValue>, Stringable {
  // @todo remove the need for these
  readonly modifierFlags: string;

  toJSON(): SingleResultJsonOutput;
}
