import { ModelType } from "../../Enums/ModelType";
import { SingleResultJsonOutput } from "./SingleResultJsonOutput";

export interface ResultCollectionJsonOutput {
  rolls: SingleResultJsonOutput[],
  type: ModelType,
  value: number
}
