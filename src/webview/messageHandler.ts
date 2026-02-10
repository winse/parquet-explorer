import * as vscode from 'vscode';
import { MessageHandlerContext } from '../types/parquet';
import { ParquetProcessor } from './ParquetProcessor';

export class MessageHandler {
  public handle(message: any, context: MessageHandlerContext): void {
    console.log('[MessageHandler] received', message.type, message, {
      filePath: context.filePath,
    });
    const { type, data } = message;

    switch (type) {
      case 'getData':
        this.handleGetData(context);
        break;
      case 'exportCSV':
        this.exportToCSV(data, context);
        break;
      case 'exportJSON':
        this.exportToJSON(data, context);
        break;
      case 'copyToClipboard':
        this.copyToClipboard(data, context);
        break;
      case 'showNotification':
        this.showNotification(message, context);
        break;
      default:
        console.log('Unknown message type:', type, message);
    }
  }

  private showNotification(message: any, context: MessageHandlerContext): void {
    const { message: notificationMessage, level } = message;
    switch (level) {
      case 'error':
        vscode.window.showErrorMessage(notificationMessage);
        break;
      case 'warning':
        vscode.window.showWarningMessage(notificationMessage);
        break;
      default:
        vscode.window.showInformationMessage(notificationMessage);
    }
  }

  private async handleGetData(context: MessageHandlerContext): Promise<void> {
    if (!context.filePath) {
      context.panel.webview.postMessage({
        type: 'error',
        message: 'No file path available. Please open a Parquet file first.',
      });
      return;
    }

    try {
      context.panel.webview.postMessage({
        type: 'loading',
        stage: 'reading',
        message: 'Reading Parquet file...',
      });

      const parquetProcessor = new ParquetProcessor();
      const { schema, records, metadata } = await parquetProcessor.processFile(context.filePath);

      context.panel.webview.postMessage({
        type: 'data',
        schema,
        records,
        header: metadata.columns,
        total: metadata.numRows,
      });

      if (metadata.numRows > records.length) {
        context.panel.webview.postMessage({
          type: 'showNotification',
          level: 'warning',
          message: `Loaded ${records.length.toLocaleString()} of ${metadata.numRows.toLocaleString()} rows for performance. ` +
            'Use export to get full data.',
        });
      }
    } catch (error: any) {
      console.error('[MessageHandler] handleGetData error', { filePath: context.filePath, error });
      context.panel.webview.postMessage({
        type: 'error',
        message: error.message || 'Failed to load Parquet file',
      });
    }
  }

  private async exportToCSV(data: any[], context: MessageHandlerContext): Promise<void> {
    try {
      const csv = this.convertToCSV(data);
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('export.csv'),
        saveLabel: 'Export CSV',
        filters: { 'CSV Files': ['csv'], 'All Files': ['*'] },
      });
      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(csv));
        vscode.window.showInformationMessage(`CSV exported successfully to ${uri.fsPath}`);
        context.panel.webview.postMessage({ type: 'exportComplete', format: 'CSV', message: 'CSV exported successfully' });
      }
    } catch (error: any) {
      context.panel.webview.postMessage({ type: 'exportError', format: 'CSV', message: error.message });
    }
  }

  private async exportToJSON(data: any[], context: MessageHandlerContext): Promise<void> {
    try {
      const json = JSON.stringify(data, null, 2);
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('export.json'),
        saveLabel: 'Export JSON',
        filters: { 'JSON Files': ['json'], 'All Files': ['*'] },
      });
      if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(json));
        vscode.window.showInformationMessage(`JSON exported successfully to ${uri.fsPath}`);
        context.panel.webview.postMessage({ type: 'exportComplete', format: 'JSON', message: 'JSON exported successfully' });
      }
    } catch (error: any) {
      context.panel.webview.postMessage({ type: 'exportError', format: 'JSON', message: error.message });
    }
  }

  private async copyToClipboard(data: string, context: MessageHandlerContext): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(data);
      context.panel.webview.postMessage({ type: 'copyComplete', message: 'Copied to clipboard' });
    } catch (error: any) {
      context.panel.webview.postMessage({ type: 'copyError', message: error.message });
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            const value = row[fieldName];
            const stringValue = String(value ?? '');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',')
      ),
    ];
    return csvRows.join('\n');
  }
}
