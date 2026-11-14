import { mersenne, xoroshiro128plus } from "pure-rand";
import type { RandomGenerator } from "pure-rand";
import { ValidationError } from "../errors/ValidationError.js";
import type { EngineFactory, RandomEngine } from "./RandomEngine.js";

const UINT32_RANGE = 0x1_0000_0000;

function randomSeed(): number {
  return (Math.random() * UINT32_RANGE) | 0;
}

function rejectSeed(name: string, seed: number | undefined): void {
  if (seed !== undefined) {
    throw new ValidationError(`The "${name}" engine does not accept a seed`);
  }
}

function wrapPureRand(
  generatorFactory: (seed: number) => RandomGenerator,
  seed?: number,
): RandomEngine {
  let generator = generatorFactory(seed ?? randomSeed());

  return {
    next(): number {
      const [value, nextGenerator] = generator.next();
      generator = nextGenerator;

      return value;
    },
  };
}

export const nativeMathFactory: EngineFactory = (seed) => {
  rejectSeed("nativeMath", seed);

  return { next: () => (Math.random() * UINT32_RANGE) | 0 };
};

export const xoroshiro128plusFactory: EngineFactory = (seed) =>
  wrapPureRand(xoroshiro128plus, seed);

export const mersenneFactory: EngineFactory = (seed) =>
  wrapPureRand(mersenne, seed);

export const cryptoFactory: EngineFactory = (seed) => {
  rejectSeed("crypto", seed);

  const crypto = globalThis.crypto;

  if (typeof crypto?.getRandomValues !== "function") {
    throw new Error(
      'The "crypto" engine requires globalThis.crypto.getRandomValues to be available',
    );
  }

  return {
    next(): number {
      return crypto.getRandomValues(new Int32Array(1))[0];
    },
  };
};

export const builtInEngineFactories: Readonly<Record<string, EngineFactory>> = {
  crypto: cryptoFactory,
  mersenne: mersenneFactory,
  nativeMath: nativeMathFactory,
  xoroshiro128plus: xoroshiro128plusFactory,
};

export const nativeMath: RandomEngine = nativeMathFactory();
