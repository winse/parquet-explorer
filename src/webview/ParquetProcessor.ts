import * as vscode from 'vscode';
import { parquetRead, parquetMetadataAsync, parquetSchema, toJson } from 'hyparquet';
import { ParquetData } from '../types/parquet';

interface ParquetBuffer {
  byteLength: number;
  slice(start: number, end?: number): Promise<ArrayBuffer>;
}

export class ParquetProcessor {
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
    try {
      console.log('🔍 开始处理 Parquet 文件:', filePath);
      const arrayBuffer = await this.readFile(filePath);
      const buffer = this.createAsyncBuffer(arrayBuffer);

      // 获取元数据
      const metadata = await parquetMetadataAsync(buffer);
      console.log('✅ 元数据读取完成, 行数:', metadata.num_rows);

      // 获取 Schema
      const schema = parquetSchema(metadata);
      console.log('✅ Schema 解析完成');

      // 提取列名 (用于表头和记录映射)
      const columns = this.extractColumnNames(schema);
      console.log('✅ 列名提取完成:', columns.length, '列');

      // 读取数据记录 (使用回调方式)
      const records = await this.readRecords(buffer, metadata, columns);
      console.log('✅ 记录读取完成, 共', records.length, '条');

      return {
        schema: this.schemaToJSON(schema),
        records,
        metadata: {
          numRows: Number(metadata.num_rows),
          columns,
          rowGroups: metadata.row_groups?.length || 1,
          compression: metadata.compression_codec,
        },
      };
    } catch (error: any) {
      console.error('❌ 处理 Parquet 文件失败:', error);
      throw new Error(`Parquet 处理错误: ${error.message || String(error)}`);
    }
  }

  private async readRecords(buffer: ParquetBuffer, metadata: any, columns: string[]): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const records: Record<string, any>[] = [];

      parquetRead({
        file: buffer,
        metadata,
        onComplete: (rows: any[][]) => {
          // 转换行数据为对象数组
          const convertedRecords = rows.map((row: any[]) => {
            const obj: Record<string, any> = {};
            row.forEach((cell, idx) => {
              const columnName = columns[idx];
              if (columnName) {
                obj[columnName] = this.normalizeCellValue(cell);
              }
            });
            return obj;
          });
          resolve(convertedRecords);
        },
      }).catch((error: Error) => {
        reject(error);
      });
    });
  }

  private async readFile(filePath: string): Promise<ArrayBuffer> {
    const uri = vscode.Uri.file(filePath);
    const buffer = await vscode.workspace.fs.readFile(uri);
    // Normalize to a standalone ArrayBuffer (no offset) for DataView consumers.
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  }

  private createAsyncBuffer(arrayBuffer: ArrayBuffer): ParquetBuffer {
    const uint8Array = new Uint8Array(arrayBuffer);
    return {
      byteLength: uint8Array.length,
      slice: async (start: number, end?: number) => {
        if (end === undefined) {
          return arrayBuffer.slice(start);
        }
        return arrayBuffer.slice(start, end);
      },
    };
  }

  private extractColumnNames(schema: any): string[] {
    const columns: string[] = [];
    if (!schema || !schema.children) return columns;
    this.traverseSchema(schema, columns);
    return columns;
  }

  private traverseSchema(node: any, columns: string[]): void {
    if (!node) return;
    if (node.element && node.element.name && (!node.children || node.children.length === 0)) {
      columns.push(node.element.name);
      return;
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.traverseSchema(child, columns);
      }
    }
  }

  private schemaToJSON(schema: any): any {
    if (!schema) return null;
    const result: any = {
      name: schema.name,
      num_columns: schema.num_columns,
      row_groups: schema.row_groups?.length || 0,
    };
    if (schema.children && Array.isArray(schema.children)) {
      result.children = schema.children.map((child: any) => this.schemaNodeToJSON(child));
    }
    return result;
  }

  private schemaNodeToJSON(node: any): any {
    if (!node || !node.element) return null;
    const element = node.element;
    const typeNameMap: Record<number, string> = {
      0: 'BOOLEAN',
      1: 'INT32',
      2: 'INT64',
      3: 'INT96',
      4: 'FLOAT',
      5: 'DOUBLE',
      6: 'BYTE_ARRAY',
      7: 'FIXED_LEN_BYTE_ARRAY',
    };
    const resolvedType = typeof element.type === 'number'
      ? (typeNameMap[element.type] || String(element.type))
      : element.type;
    const rawType = element.type === resolvedType ? undefined : element.type;
    const result: any = { name: element.name, rawType, type: resolvedType };
    if (element.repetition_type) result.repetition_type = element.repetition_type;
    if (element.logical_type) result.logical_type = element.logical_type;
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      result.children = node.children.map((child: any) => this.schemaNodeToJSON(child));
    }
    return result;
  }
}
