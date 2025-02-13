import { Stringable } from "../Stringable";
import { JsonSerializable } from "../JsonSerializable";
import { ResultValue } from "./ResultValue";

export interface Result extends JsonSerializable, Required<ResultValue>, Stringable {
  // @todo remove the need for these
  readonly modifierFlags: string;
}
