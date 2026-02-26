import * as vscode from "vscode";
import { tableFromIPC, Table, Field } from "apache-arrow";
import { readParquet } from "parquet-wasm/node";
import * as date from "date-and-time";
import { ParquetData } from "../types/parquet";

export class ParquetProcessor {
  private static readonly maxRecords = 20000;
  private static readonly supportedCodecs = new Set([
    "UNCOMPRESSED",
    "SNAPPY",
    "GZIP",
    "BROTLI",
    "ZSTD",
    "LZ4_RAW",
  ]);

  private normalizeCellValue(
    value: any,
    fieldType: string,
    timestampFormat: string,
    dateFormat: string,
  ): any {
    if (value === null || value === undefined) return "";

    // More robust timestamp type detection - check for various Arrow timestamp representations
    const typeStr = fieldType.toLowerCase();
    const isTimestamp =
      typeStr.includes("timestamp") ||
      typeStr.includes("timeinstant") ||
      typeStr.includes("datetime");
    const isDate = typeStr.includes("date");

    if (isTimestamp || isDate) {
      let dateValue: Date | null = null;

      // If value is already a Date object from Arrow, use it directly
      if (value instanceof Date) {
        dateValue = value;
      } else {
        // Try to convert numeric timestamp values
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          if (isTimestamp) {
            // Handle different timestamp unit formats from parquet-wasm/Arrow
            // Nanoseconds (>1e15), microseconds (>1e12), milliseconds (>1e9), seconds
            if (numValue > 1e15) {
              // Nanoseconds - divide by 1e6 to get milliseconds
              dateValue = new Date(Math.floor(numValue / 1e6));
            } else if (numValue > 1e14 && numValue <= 1e15) {
              // Likely microseconds - divide by 1e3 to get milliseconds
              dateValue = new Date(Math.floor(numValue / 1e3));
            } else if (numValue > 1e11) {
              // Milliseconds
              dateValue = new Date(numValue);
            } else if (numValue > 1e9) {
              // Seconds - multiply by 1000 to get milliseconds
              dateValue = new Date(numValue * 1000);
            } else {
              // Very small values might be days since epoch (rare for timestamps)
              dateValue = new Date(numValue * 24 * 60 * 60 * 1000);
            }
          } else if (isDate) {
            // Parquet Date is usually days since epoch
            if (numValue >= 0 && numValue < 100000) {
              dateValue = new Date(numValue * 24 * 60 * 60 * 1000);
            }
          }
        } else if (typeof value === "string") {
          // Try parsing string dates
          const parsed = Date.parse(value);
          if (!isNaN(parsed)) {
            dateValue = new Date(parsed);
          }
        }
      }

      if (dateValue && !isNaN(dateValue.getTime())) {
        try {
          return date.format(
            dateValue,
            isTimestamp ? timestampFormat : dateFormat,
          );
        } catch (e) {
          // If formatting fails, return the original value
          return String(value);
        }
      }
    }

    if (typeof value === "bigint") return value.toString();
    if (typeof value === "object") {
      if (value && Object.keys(value).length === 0) return "";
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  public async processFile(
    filePath: string,
    timestampFormat: string = "YYYY-MM-DD HH:mm:ss.SSS",
    dateFormat: string = "YYYY-MM-DD",
  ): Promise<ParquetData> {
    let wasmTable: {
      intoIPCStream: () => Uint8Array;
      drop?: () => void;
    } | null = null;

    try {
      const arrayBuffer = await this.readFile(filePath);

      const parquetUint8Array = new Uint8Array(arrayBuffer);

      wasmTable = readParquet(parquetUint8Array);
      if (!wasmTable) {
        throw new Error("Failed to read Parquet file (empty table).");
      }
      const arrowTable = tableFromIPC(wasmTable.intoIPCStream());

      const schema = this.schemaFromArrow(arrowTable);
      const columns = arrowTable.schema.fields.map((field) => field.name);
      const records = this.tableToRecords(
        arrowTable,
        columns,
        ParquetProcessor.maxRecords,
        timestampFormat,
        dateFormat,
      );

      return {
        schema,
        records,
        metadata: {
          numRows: Number(arrowTable.numRows),
          columns,
          rowGroups: 1,
          compression: "UNKNOWN",
        },
      };
    } catch (error: any) {
      console.error("[ParquetProcessor] failed", { filePath, error });
      const message = error?.message || String(error);

      if (this.isCompressionError(message)) {
        const supportedList = Array.from(ParquetProcessor.supportedCodecs).join(
          ", ",
        );
        throw new Error(
          `Unsupported compression codec. ` +
            `This viewer supports ${supportedList}. ` +
            `Please re-encode the file using a supported codec (e.g. ZSTD or SNAPPY).`,
        );
      }

      throw new Error(`Parquet processing error: ${message}`);
    } finally {
      if (wasmTable?.drop) {
        try {
          wasmTable.drop();
        } catch {
          // Ignore drop errors.
        }
      }
    }
  }

  private isCompressionError(message: string): boolean {
    const lowered = message.toLowerCase();
    return (
      lowered.includes("compression") ||
      lowered.includes("codec") ||
      lowered.includes("parquet unsupported")
    );
  }

  private async readFile(filePath: string): Promise<ArrayBuffer> {
    const uri = vscode.Uri.file(filePath);
    const buffer = await vscode.workspace.fs.readFile(uri);
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
  }

  private tableToRecords(
    table: Table,
    columns: string[],
    maxRecords: number,
    timestampFormat: string,
    dateFormat: string,
  ): Record<string, any>[] {
    const rowCount = Math.min(table.numRows, maxRecords);
    const records: Record<string, any>[] = new Array(rowCount);
    const vectors = columns.map((_, index) => table.getChildAt(index));
    const fields = table.schema.fields;



    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row: Record<string, any> = {};
      for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
        const vector = vectors[colIndex];
        if (!vector) continue;

        const field = fields[colIndex];
        const typeStr = field.type.toString();
        const value = vector.get(rowIndex);



        row[columns[colIndex]] = this.normalizeCellValue(
          value,
          typeStr,
          timestampFormat,
          dateFormat,
        );
      }
      records[rowIndex] = row;
    }

    return records;
  }

  private schemaFromArrow(table: Table): any {
    const schema = table.schema;
    return {
      name: "schema",
      num_columns: schema.fields.length,
      row_groups: 1,
      children: schema.fields.map((field) => this.fieldToJSON(field)),
    };
  }

  private fieldToJSON(field: Field<any>): any {
    const type = field.type as any;
    const result: any = {
      name: field.name,
      type:
        typeof type?.toString === "function" ? type.toString() : String(type),
      repetition_type: field.nullable ? "OPTIONAL" : "REQUIRED",
    };

    if (Array.isArray(type?.children) && type.children.length > 0) {
      result.children = type.children.map((child: Field<any>) =>
        this.fieldToJSON(child),
      );
    }

    return result;
  }
}
