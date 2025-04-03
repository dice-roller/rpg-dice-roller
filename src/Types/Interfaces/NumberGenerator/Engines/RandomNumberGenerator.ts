import { Engine } from "./Engine";

export interface RandomNumberGenerator {
  engine: Engine;

  integer(min: number, max: number): number;
  float(min: number, max: number, inclusive: boolean): number;
}
