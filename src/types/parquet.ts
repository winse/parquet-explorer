/**
 * Parquet Schema 类型定义
 */
export interface ParquetSchemaNode {
  name: string;
  type: string;
  repetition_type?: 'REQUIRED' | 'OPTIONAL' | 'REPEATED';
  children?: ParquetSchemaNode[];
  logical_type?: string;
  converted_type?: string;
}

export interface ParquetMetadata {
  numRows: number;
  columns: string[];
  rowGroups: number;
  compression?: string;
  schema?: ParquetSchemaNode;
}

export interface CachedParquetData {
  schema: any;
  records: Record<string, any>[];
  header: string[];
  total: number;
}

export interface ParquetData {
  schema: any;
  records: Record<string, any>[];
  metadata: ParquetMetadata;
}

export type ParquetMessage =
  | { type: 'loading'; stage: string; message: string; progress?: number }
  | { type: 'data'; schema: any; records: any[]; header: string[]; total: number }
  | { type: 'error'; message: string }
  | { type: 'exportComplete'; format: string; message?: string }
  | { type: 'exportError'; format: string; message: string }
  | { type: 'copyComplete'; message: string }
  | { type: 'copyError'; message: string }
  | { type: 'showNotification'; message: string; level: 'info' | 'warning' | 'error' };

export interface MessageHandlerContext {
  panel: any;
  extensionUri: any;
  filePath?: string;
}
