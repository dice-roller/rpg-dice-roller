import type { Presenter } from "./presenters/Presenter.js";
import { defaultTextPresenter } from "./presenters/TextPresenter.js";
import type { Roll } from "./Roll.js";
import { toHistoryData } from "./serialization/encode.js";
import type { HistoryData } from "./serialization/formats.js";

/** A log of rolls. */
export class RollHistory implements Iterable<Roll<unknown>> {
  readonly #rolls: Roll<unknown>[] = [];

  /** A copy of the rolls, oldest first. */
  get rolls(): readonly Roll<unknown>[] {
    return [...this.#rolls];
  }

  /** The sum of the roll totals. */
  get total(): number {
    return this.#rolls.reduce((total, roll) => total + roll.total, 0);
  }

  get length(): number {
    return this.#rolls.length;
  }

  add(...rolls: Roll<unknown>[]): void {
    this.#rolls.push(...rolls);
  }

  clear(): void {
    this.#rolls.length = 0;
  }

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

  toJSON(): HistoryData {
    return toHistoryData(this);
  }
}
