import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { Roll } from "./Roll.js";
import { encodeNumbers, toHistoryData } from "./serialization/encode.js";
import type { EncodedHistoryData } from "./serialization/formats.js";

/** A log of rolls. */
export class RollHistory implements Iterable<Roll<unknown>> {
  readonly #rolls: Roll<unknown>[] = [];

  /** A copy of the rolls, oldest first. */
  get rolls(): readonly Roll<unknown>[] {
    return [...this.#rolls];
  }

  /** The sum of the roll totals, or 0 when empty (`NaN` if they include both `Infinity` and `-Infinity`). */
  get total(): number {
    return this.#rolls.reduce((total, roll) => total + roll.total, 0);
  }

  /** Number of rolls in the history. */
  get length(): number {
    return this.#rolls.length;
  }

  /** Appends rolls in order. */
  add(...rolls: Roll<unknown>[]): void {
    this.#rolls.push(...rolls);
  }

  /** Removes all rolls from the history. */
  clear(): void {
    this.#rolls.length = 0;
  }

  /** Iterates over a snapshot of the rolls, oldest first. */
  [Symbol.iterator](): Iterator<Roll<unknown>> {
    return this.rolls[Symbol.iterator]();
  }

  /** Presents the whole history; defaults to the default `TextPresenter`. */
  present<T = string>(presenter?: Presenter<T>): T {
    return (
      presenter ?? (defaultTextPresenter as unknown as Presenter<T>)
    ).present(this);
  }

  /** Always the default `TextPresenter` output. */
  toString(): string {
    return defaultTextPresenter.present(this);
  }

  /** JSON-safe export data with non-finite numbers tagged; evaluates uncached roll min/max totals. */
  toJSON(): EncodedHistoryData {
    return encodeNumbers(toHistoryData(this));
  }
}
