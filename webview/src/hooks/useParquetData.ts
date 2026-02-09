import { useState, useEffect, useCallback } from 'react';

export interface UseParquetDataReturn {
  schema: any;
  records: any[];
  header: string[];
  loading: boolean;
  error: string | null;
  progress: number;
  total: number;
  filteredRecords: any[];
}

export function useParquetData(): UseParquetDataReturn {
  const [schema, setSchema] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [header, setHeader] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);

  useEffect(() => {
    console.log('[useParquetData] Initializing...');
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'loading':
          setLoading(true);
          setProgress(message.progress || 0);
          break;
        case 'metadata':
          setSchema(message.schema);
          break;
        case 'data':
          setSchema(message.schema);
          setRecords(message.records);
          setHeader(message.header);
          setTotal(message.total);
          setFilteredRecords(message.records);
          setLoading(false);
          setError(null);
          break;
        case 'progress':
          setProgress(message.current);
          break;
        case 'error':
          console.error('[useParquetData] Error:', message.message);
          setError(message.message);
          setLoading(false);
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    window.vscode?.postMessage({ type: 'getData' });
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { schema, records, header, loading, error, progress, total, filteredRecords };
}
