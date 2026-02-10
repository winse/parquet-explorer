import * as vscode from 'vscode';
import * as path from 'path';
import { ParquetProcessor } from './ParquetProcessor';
import { MessageHandler } from './messageHandler';
import { MessageHandlerContext, CachedParquetData } from '../types/parquet';

export class WebviewManager {
  private panel: vscode.WebviewPanel | undefined;
  private parquetProcessor: ParquetProcessor;
  private currentFilePath: string | undefined;
  private initialized: boolean = false;
  private dataCache: Map<string, CachedParquetData> = new Map();

  constructor(
    private context: vscode.ExtensionContext,
    private messageHandler: MessageHandler
  ) {
    this.parquetProcessor = new ParquetProcessor();
  }

  public createOrShow(filePath: string): void {
    const fileName = path.basename(filePath);
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      this.panel.title = `Parquet Explorer: ${fileName}`;
      const cached = this.dataCache.get(filePath);
      if (cached) {
        this.panel.webview.postMessage({
          type: 'data',
          schema: cached.schema,
          records: cached.records,
          header: cached.header,
          total: cached.total,
        });
        return;
      }
      this.currentFilePath = filePath;
      this.loadFile(filePath);
    } else {
      this.createPanel(filePath, fileName);
    }
  }

  public createOrShowWithPanel(filePath: string, panel: vscode.WebviewPanel): void {
    if (this.panel === panel && this.initialized) {
      panel.reveal(vscode.ViewColumn.One);
      const cached = this.dataCache.get(filePath);
      if (cached) {
        panel.webview.postMessage({
          type: 'data',
          schema: cached.schema,
          records: cached.records,
          header: cached.header,
          total: cached.total,
        });
      }
      return;
    }

    this.panel = panel;
    this.currentFilePath = filePath;
    const fileName = path.basename(filePath);
    panel.title = fileName;
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
    };

    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.css')
    );

    panel.webview.html = this.getHtmlContent(scriptUri, styleUri);

    panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.initialized = false;
      },
      undefined,
      this.context.subscriptions
    );

    const context: MessageHandlerContext = {
      panel: this.panel,
      extensionUri: this.context.extensionUri,
      filePath,
    };

    panel.webview.onDidReceiveMessage(
      (message) => this.messageHandler.handle(message, context),
      undefined,
      this.context.subscriptions
    );

    const cached = this.dataCache.get(filePath);
    if (cached) {
      panel.webview.postMessage({
        type: 'data',
        schema: cached.schema,
        records: cached.records,
        header: cached.header,
        total: cached.total,
      });
      this.initialized = true;
      return;
    }

    this.loadFile(filePath);
    this.initialized = true;
  }

  private createPanel(filePath: string, fileName: string): void {
    this.currentFilePath = filePath;
    this.panel = vscode.window.createWebviewPanel(
      'parquetViewer',
      `Parquet Explorer: ${fileName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
      }
    );

    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.css')
    );

    this.panel.webview.html = this.getHtmlContent(scriptUri, styleUri);

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.initialized = false;
        this.currentFilePath = undefined;
      },
      undefined,
      this.context.subscriptions
    );

    const context: MessageHandlerContext = {
      panel: this.panel,
      extensionUri: this.context.extensionUri,
      filePath,
    };

    this.panel.webview.onDidReceiveMessage(
      (message) => this.messageHandler.handle(message, context),
      undefined,
      this.context.subscriptions
    );

    this.loadFile(filePath);
    this.initialized = true;
  }

  private async loadFile(filePath: string): Promise<void> {
    if (!this.panel) return;
    try {
      this.panel.webview.postMessage({
        type: 'loading',
        stage: 'reading',
        message: 'Reading Parquet file...',
      });

      const { schema, records, metadata } = await this.parquetProcessor.processFile(filePath);

      const data: CachedParquetData = {
        schema,
        records,
        header: metadata.columns,
        total: metadata.numRows,
      };

      this.dataCache.set(filePath, data);

      this.panel.webview.postMessage({
        type: 'data',
        schema,
        records,
        header: data.header,
        total: data.total,
      });
    } catch (error: any) {
      console.error('[WebviewManager] loadFile error', { filePath, error });
      this.panel.webview.postMessage({
        type: 'error',
        message: error.message || 'Failed to load Parquet file',
      });
    }
  }

  private getHtmlContent(scriptUri: vscode.Uri, styleUri: vscode.Uri): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    img-src ${this.panel?.webview.cspSource} https: data:;
    script-src ${this.panel?.webview.cspSource} 'unsafe-inline';
    style-src ${this.panel?.webview.cspSource} 'unsafe-inline';
    connect-src https:;
    font-src ${this.panel?.webview.cspSource};
  ">
  <link href="${styleUri}" rel="stylesheet">
  <title>Parquet Explorer</title>
</head>
<body>
  <div id="root"></div>
  <script>
    const vscode = acquireVsCodeApi();
    window.vscode = vscode;
  </script>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
