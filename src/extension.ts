import * as vscode from 'vscode';
import { registerOpenParquetViewerCommand } from './commands/openParquetViewer';
import { WebviewManager } from './webview/WebviewManager';
import { MessageHandler } from './webview/messageHandler';
import { registerParquetEditor } from './webview/ParquetEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('✅ parquet-explorer extension is now active');
  const messageHandler = new MessageHandler();
  const webviewManager = new WebviewManager(context, messageHandler);
  const editorDisposable = registerParquetEditor(context, webviewManager);
  context.subscriptions.push(editorDisposable);
  const commandDisposable = registerOpenParquetViewerCommand(context, webviewManager);
  context.subscriptions.push(commandDisposable);
}

export function deactivate() {
  console.log('❌ parquet-explorer extension is now deactivated');
}
