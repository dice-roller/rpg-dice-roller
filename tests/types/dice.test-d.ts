import { DieRegistry } from "../../src/dice/DieRegistry.js";
import {
  faceDie,
  fudgeDie,
  percentileDie,
  rangeDie,
  standardDie,
} from "../../src/dice/presets.js";
import type { DieFactory, DieLike, ResolvedDie } from "../../src/dice/types.js";
import type { NumberGenerator } from "../../src/random/NumberGenerator.js";
import { accepts } from "./helpers.js";

// plain objects
accepts<DieLike>({ min: 1, max: 6 });
accepts<DieLike>({ min: 2, max: 7, notation: "custom" });
accepts<DieLike>({ faces: [1, 1, 2, 3, 5, 8] });
accepts<DieLike>({ faces: [-1, 0, 1], notation: "F" });

// function-valued properties
accepts<DieLike>({ min: () => 1, max: 6 });
accepts<DieLike>({ faces: [1, 2, 3], average: () => 2, faceCount: 3 });
accepts<DieLike>({
  min: 1,
  max: 6,
  roll: (generator: NumberGenerator) => generator.integer(1, 6),
});

// class instance with getters, methods and roll()
class CustomDie {
  readonly faces: readonly number[];
  constructor(sides = 4) {
    this.faces = Array.from({ length: sides }, (_, index) => index + 1);
  }
  get min(): number {
    return Math.min(...this.faces);
  }
  average(): number {
    return 2.5;
  }
  roll(generator: NumberGenerator): number {
    return generator.integer(1, this.faces.length);
  }
}
accepts<DieLike>(new CustomDie());

// presets
accepts<DieLike>(standardDie(6));
accepts<DieLike>(percentileDie);
accepts<DieLike>(fudgeDie(1));
accepts<DieLike>(rangeDie(-2, 3));
accepts<DieLike>(faceDie([1, 1, 2, 3, 5, 8], { notation: "fib" }));
// @ts-expect-error - presets only take a notation label
rangeDie(1, 6, { id: "x" });

// dice don't have ids; the registry stores factories by name
// @ts-expect-error - `id` isn't part of a die
accepts<DieLike>({ min: 1, max: 6, id: "my-d6" });
accepts<DieFactory>(standardDie);
accepts<DieFactory>(() => ({ faces: [1, 1, 2, 3, 5, 8] }));
accepts<DieFactory>((sides: number) => new CustomDie(sides));
const registry = new DieRegistry()
  .register("fib", () => faceDie([1, 1, 2, 3, 5, 8]))
  .register("loaded", (sides) => new CustomDie(sides));
accepts<DieLike | undefined>(registry.get("standard")?.(6));
accepts<DieLike>(registry.create("range", -2, 3));
// @ts-expect-error - a factory needs a name
registry.register(() => percentileDie);
// @ts-expect-error - a factory returns a die
registry.register("bad", () => "d6");
// @ts-expect-error - factory arguments are numbers
registry.create("standard", "6");

// rejected: no range or faces
// @ts-expect-error - a die needs `min` and `max`, or `faces`
accepts<DieLike>({});
// @ts-expect-error - `max` is missing
accepts<DieLike>({ min: 1 });
// @ts-expect-error - faces must be numbers
accepts<DieLike>({ faces: ["a", "b"] });
// @ts-expect-error - fudge dice only have 1 or 2 non-blanks
fudgeDie(3);

// a resolved die only has plain numbers
accepts<ResolvedDie["min"]>(1);
// @ts-expect-error - resolved values are not functions
accepts<ResolvedDie["average"]>(() => 1);
