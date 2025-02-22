import { SeedableEngine } from "../../types/Interfaces/NumberGenerator/SeedableEngine";
import { MersenneTwister19937 } from "random-js";

class MersenneTwister implements SeedableEngine {
  #engine!: MersenneTwister19937;

  constructor(seed?: number) {
    if (seed) {
      this.seed(seed);
    } else {
      this.autoSeed();
    }
  }

  autoSeed(): this {
    this.#engine = MersenneTwister19937.autoSeed();
    return this;
  }

  seed(seed: number): this {
    this.#engine = MersenneTwister19937.seed(seed);
    return this;
  }

  discard(count: number): this {
    this.#engine.discard(count);
    return this;
  }

  getUseCount(): number {
    return this.#engine.getUseCount();
  }

  next(): number {
    return this.#engine.next();
  }
}

export default MersenneTwister;

const engine = new MersenneTwister();

export {
  engine,
};
