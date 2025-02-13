export interface ResultValue {
  readonly initialValue: number;

  calculationValue: number;
  modifiers?: Set<string>|string[],
  useInTotal?: boolean;
  value: number;
}
