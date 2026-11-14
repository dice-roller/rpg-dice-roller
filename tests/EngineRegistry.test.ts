import { mersenne } from "pure-rand";
import { EngineRegistry } from "../src/random/EngineRegistry.js";
import type { EngineFactory } from "../src/random/RandomEngine.js";
import { ValidationError } from "../src/errors/ValidationError.js";

describe("EngineRegistry", () => {
  const registry = new EngineRegistry();

  test("registers the built-in engines", () => {
    expect(registry.names).toEqual([
      "crypto",
      "mersenne",
      "nativeMath",
      "xoroshiro128plus",
    ]);
  });

  test.each(["mersenne", "xoroshiro128plus"])(
    "%s engines with the same seed have the same sequence",
    (name) => {
      const first = registry.create(name, 42);
      const second = registry.create(name, 42);

      expect(Array.from({ length: 5 }, () => first.next())).toEqual(
        Array.from({ length: 5 }, () => second.next()),
      );
      expect(first).not.toBe(second);
    },
  );

  test("mersenne wraps the pure-rand generator sequence", () => {
    const engine = registry.create("mersenne", 42);
    let generator = mersenne(42);
    const expected: number[] = [];

    for (let i = 0; i < 5; i++) {
      const [value, nextGenerator] = generator.next();
      expected.push(value);
      generator = nextGenerator;
    }

    expect(Array.from({ length: 5 }, () => engine.next())).toEqual(expected);
  });

  test("seeded engines accept omitted seeds", () => {
    expect(() => registry.create("mersenne").next()).not.toThrow();
    expect(() => registry.create("xoroshiro128plus").next()).not.toThrow();
  });

  test.each([
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -0x8000_0001,
    0x8000_0000,
  ])("rejects invalid seed %s", (seed) => {
    expect(() => registry.create("mersenne", seed)).toThrow(ValidationError);
  });

  test("rejects seeds for unseeded built-ins", () => {
    expect(() => registry.create("nativeMath", 42)).toThrow(
      /does not accept a seed/,
    );
    expect(() => registry.create("crypto", 42)).toThrow(
      /does not accept a seed/,
    );
  });

  test("custom factories are registered, replaced, and removed by name", () => {
    const firstFactory: EngineFactory = () => ({ next: () => 1 });
    const replacement: EngineFactory = () => ({ next: () => 2 });
    const custom = EngineRegistry.empty().register("custom", firstFactory);

    expect(custom.get("custom")).toBe(firstFactory);
    expect(custom.create("custom").next()).toBe(1);
    custom.register("custom", replacement);
    expect(custom.create("custom").next()).toBe(2);
    expect(custom.remove("custom")).toBe(true);
    expect(custom.remove("custom")).toBe(false);
    expect(() => custom.create("custom")).toThrow(ValidationError);
  });

  test("validates names, factories, and factory results", () => {
    expect(() =>
      EngineRegistry.empty().register("", () => ({ next: () => 0 })),
    ).toThrow(ValidationError);
    expect(() =>
      EngineRegistry.empty().register(
        "invalid",
        undefined as unknown as EngineFactory,
      ),
    ).toThrow(ValidationError);
    expect(() =>
      EngineRegistry.empty()
        .register("invalid", () => null as unknown as ReturnType<EngineFactory>)
        .create("invalid"),
    ).toThrow(/must return an object with a next\(\) method/);
    expect(() => registry.create("missing")).toThrow(/Unknown random engine/);
  });

  test("propagates custom factory errors", () => {
    const error = new Error("factory failed");
    const custom = EngineRegistry.empty().register("broken", () => {
      throw error;
    });

    expect(() => custom.create("broken")).toThrow(error);
  });

  test("crypto delegates signed integer draws to Web Crypto", () => {
    const values = [-0x8000_0000, 0x7fff_ffff];
    let index = 0;
    const fakeCrypto = {
      getRandomValues(this: Crypto, array: Int32Array): Int32Array {
        expect(this).toBe(fakeCrypto);
        array[0] = values[index++];
        return array;
      },
    } as unknown as Crypto;

    withCrypto(fakeCrypto, () => {
      const engine = registry.create("crypto");

      expect(engine.next()).toBe(-0x8000_0000);
      expect(engine.next()).toBe(0x7fff_ffff);
    });
  });

  test("crypto checks Web Crypto when selected and propagates platform errors", () => {
    withCrypto(undefined, () => {
      expect(() => registry.create("crypto")).toThrow(/getRandomValues/);
    });

    const error = new Error("platform failure");
    const fakeCrypto = {
      getRandomValues(): never {
        throw error;
      },
    } as unknown as Crypto;

    withCrypto(fakeCrypto, () => {
      expect(() => registry.create("crypto").next()).toThrow(error);
    });
  });
});

function withCrypto(crypto: Crypto | undefined, callback: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");

  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: crypto,
    writable: true,
  });

  try {
    callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "crypto", descriptor);
    } else {
      Reflect.deleteProperty(globalThis, "crypto");
    }
  }
}
