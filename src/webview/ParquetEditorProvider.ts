import * as vscode from "vscode";
import { WebviewManager } from "./WebviewManager";

export class ParquetEditorProvider implements vscode.CustomReadonlyEditorProvider<vscode.CustomDocument> {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly webviewManager: WebviewManager,
  ) {}

  async openCustomEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
  ): Promise<void> {
    await this.webviewManager.createOrShowWithPanel(
      document.uri.fsPath,
      webviewPanel,
    );
  }

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    await this.webviewManager.createOrShowWithPanel(
      document.uri.fsPath,
      webviewPanel,
    );
  }

  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: { backupId?: string | undefined },
    _token: vscode.CancellationToken,
  ): Promise<vscode.CustomDocument> {
    return { uri, dispose: () => {} };
  }

  async saveCustomEditor(
    _document: vscode.CustomDocument,
    _cancellationToken: vscode.CancellationToken,
  ): Promise<void> {}
  async revertCustomEditor(
    _document: vscode.CustomDocument,
    _cancellationToken: vscode.CancellationToken,
  ): Promise<void> {}

  async backupCustomEditor(
    document: vscode.CustomDocument,
    _context: vscode.CustomDocumentBackupContext,
    _cancellationToken: vscode.CancellationToken,
  ): Promise<vscode.CustomDocumentBackup> {
    return { id: document.uri.fsPath, delete: () => {} };
  }
}

export function registerParquetEditor(
  context: vscode.ExtensionContext,
  webviewManager: WebviewManager,
): vscode.Disposable {
  const provider = new ParquetEditorProvider(context, webviewManager);
  return vscode.window.registerCustomEditorProvider(
    "parquet-explr.parquetEditor",
    provider,
    {
      webviewOptions: { retainContextWhenHidden: true },
    },
  );
}
