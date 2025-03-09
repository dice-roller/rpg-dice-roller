import { Engine } from "./Engine";

export interface RandomNumberGenerator {
  engine: Engine;

  integer(min: number, max: number): number;
  // @todo possibly rename to `float`
  real(min: number, max: number, inclusive: boolean): number;
}
