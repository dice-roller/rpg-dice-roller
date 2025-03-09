import { Engine as BaseEngine } from "random-js";

export interface Engine extends BaseEngine {
  range?: number[];
}
