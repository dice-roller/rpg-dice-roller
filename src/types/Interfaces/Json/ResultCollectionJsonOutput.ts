import { ModelType } from "../../Enums/ModelType";
import { SingleResultJsonOutput } from "./SingleResultJsonOutput";

export interface ResultCollectionJsonOutput {
  rolls: (SingleResultJsonOutput|number)[],
  type?: ModelType,
  value?: number
}
