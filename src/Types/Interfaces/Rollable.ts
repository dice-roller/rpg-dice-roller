export interface Rollable {
  max?: number,
  min?: number,
  rollTable?: (number|{ value: number, weight?: number })[];
}
