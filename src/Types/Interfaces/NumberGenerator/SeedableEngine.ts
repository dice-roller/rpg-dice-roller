import { Engine } from "./Engines/Engine";

export interface SeedableEngine extends Engine{
  autoSeed(): this;
  discard(count: number): this;
  getUseCount(): number;
  seed(seed: number): this;
}
