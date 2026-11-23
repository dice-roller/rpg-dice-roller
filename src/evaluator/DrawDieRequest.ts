/** A description of a die draw requested from an external source. */
export interface DrawDieRequest {
  readonly notation: string;
  readonly min: number;
  readonly max: number;
  readonly faces?: readonly number[];
  readonly factoryName: string;
}

/** Supplies a face value for a requested die. */
export type DrawDieCallback = (
  request: DrawDieRequest,
) => number | Promise<number>;

/** Synchronous or asynchronous external dice-source mode. */
export type DrawMode = "sync" | "async";

/** Configuration for using an external source to draw die faces. */
export type DrawDieOptions =
  | {
      readonly drawMode: "sync";
      readonly callback: DrawDieCallback;
    }
  | {
      readonly drawMode: "async";
      readonly callback: DrawDieCallback;
    };

export type DrawDieSyncOptions = Extract<
  DrawDieOptions,
  { readonly drawMode: "sync" }
>;

export type DrawDieAsyncOptions = Extract<
  DrawDieOptions,
  { readonly drawMode: "async" }
>;
