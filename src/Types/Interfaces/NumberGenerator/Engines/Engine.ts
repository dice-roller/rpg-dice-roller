import { RandomGenerator } from "pure-rand";

export interface Engine extends Partial<Omit<RandomGenerator, 'next' | 'clone'>> {
  clone(): Engine;
  next(): number;
  range?: number[];
}
