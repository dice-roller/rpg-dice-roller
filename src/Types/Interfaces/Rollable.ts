import { Modifiable } from "./Modifiable";

export interface Rollable extends Partial<Modifiable> {
  max?: number,
  min?: number,
  rollTable?: (number|{ value: number, weight?: number })[];
}
