export interface Importable<TInput, TOutput> {
  import(data: TInput): TOutput;
}
