import type { Presentable } from "./Presentable.js";

/**
 * Turns a roll, a roll history, or a result node into any output, e.g. text, HTML or Markdown.
 *
 * @typeParam T the output type
 */
export interface Presenter<T = string> {
  /** Presents a roll, history, or expression result in this presenter's output type. */
  present(target: Presentable): T;
}
