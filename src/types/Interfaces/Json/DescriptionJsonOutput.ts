import Description from "../../../Description";

export interface DescriptionJsonOutput {
  description: ReturnType<Description['toJSON']> | null,
}
