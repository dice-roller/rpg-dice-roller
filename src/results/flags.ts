/**
 * Semantic flags recording what happened to a die or group member.
 *
 * Presenters decide how to show them (e.g. `TextPresenter` maps `explode` to `!`).
 */
export const RESULT_FLAGS = [
  "explode",
  "explode-matching-batch",
  "explode-matching-batch-failure",
  "compound",
  "penetrate",
  "re-roll",
  "re-roll-once",
  "drop",
  "max",
  "min",
  "target-success",
  "target-failure",
  "critical-success",
  "critical-failure",
  "unique",
  "unique-once",
] as const;

/** A semantic marker on a scored die or group member, interpreted by presenters. */
export type ResultFlag = (typeof RESULT_FLAGS)[number];
