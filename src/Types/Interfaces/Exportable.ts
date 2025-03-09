import { ExportFormat } from "../Enums/ExportFormat";

export interface Exportable {
  export(format: ExportFormat): string|object;
}
