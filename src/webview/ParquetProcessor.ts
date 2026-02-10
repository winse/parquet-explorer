import * as vscode from 'vscode';
import { tableFromIPC, Table, Field } from 'apache-arrow';
import { readParquet } from 'parquet-wasm/node';
import { ParquetData } from '../types/parquet';

export class ParquetProcessor {
  private static readonly maxRecords = 20000;
  private static readonly supportedCodecs = new Set([
    'UNCOMPRESSED',
    'SNAPPY',
    'GZIP',
    'BROTLI',
    'ZSTD',
    'LZ4_RAW',
  ]);

  private normalizeCellValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toString();
    if (typeof value === 'object') {
      if (value && Object.keys(value).length === 0) return '';
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  public async processFile(filePath: string): Promise<ParquetData> {
    let wasmTable: { intoIPCStream: () => Uint8Array; drop?: () => void } | null = null;

    try {
      console.log('[ParquetProcessor] start', { filePath });
      const arrayBuffer = await this.readFile(filePath);
      const parquetUint8Array = new Uint8Array(arrayBuffer);

      wasmTable = readParquet(parquetUint8Array);
      const arrowTable = tableFromIPC(wasmTable.intoIPCStream());

      const schema = this.schemaFromArrow(arrowTable);
      const columns = arrowTable.schema.fields.map((field) => field.name);
      const records = this.tableToRecords(arrowTable, columns, ParquetProcessor.maxRecords);

      return {
        schema,
        records,
        metadata: {
          numRows: Number(arrowTable.numRows),
          columns,
          rowGroups: 1,
          compression: 'UNKNOWN',
        },
      };
    } catch (error: any) {
      console.error('[ParquetProcessor] failed', { filePath, error });
      const message = error?.message || String(error);

      if (this.isCompressionError(message)) {
        const supportedList = Array.from(ParquetProcessor.supportedCodecs).join(', ');
        throw new Error(
          `Unsupported compression codec. ` +
          `This viewer supports ${supportedList}. ` +
          `Please re-encode the file using a supported codec (e.g. ZSTD or SNAPPY).`
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
    return lowered.includes('compression') || lowered.includes('codec') || lowered.includes('parquet unsupported');
  }

  private async readFile(filePath: string): Promise<ArrayBuffer> {
    const uri = vscode.Uri.file(filePath);
    const buffer = await vscode.workspace.fs.readFile(uri);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  }

  private tableToRecords(table: Table, columns: string[], maxRecords: number): Record<string, any>[] {
    const rowCount = Math.min(table.numRows, maxRecords);
    const records: Record<string, any>[] = new Array(rowCount);
    const vectors = columns.map((_, index) => table.getChildAt(index));

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row: Record<string, any> = {};
      for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
        const vector = vectors[colIndex];
        if (!vector) continue;
        row[columns[colIndex]] = this.normalizeCellValue(vector.get(rowIndex));
      }
      records[rowIndex] = row;
    }

    return records;
  }

  private schemaFromArrow(table: Table): any {
    const schema = table.schema;
    return {
      name: 'schema',
      num_columns: schema.fields.length,
      row_groups: 1,
      children: schema.fields.map((field) => this.fieldToJSON(field)),
    };
  }

  private fieldToJSON(field: Field<any>): any {
    const type = field.type as any;
    const result: any = {
      name: field.name,
      type: typeof type?.toString === 'function' ? type.toString() : String(type),
      repetition_type: field.nullable ? 'OPTIONAL' : 'REQUIRED',
    };

    if (Array.isArray(type?.children) && type.children.length > 0) {
      result.children = type.children.map((child: Field<any>) => this.fieldToJSON(child));
    }

    return result;
  }
}
