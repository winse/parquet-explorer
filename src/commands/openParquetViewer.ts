import * as vscode from "vscode";
import { WebviewManager } from "../webview/WebviewManager";

export function registerOpenParquetViewerCommand(
  context: vscode.ExtensionContext,
  webviewManager: WebviewManager,
): vscode.Disposable {
  return vscode.commands.registerCommand("parquet-explr.open", async () => {
    const parquetPath = await getActiveParquetFilePath();
    if (!parquetPath) {
      vscode.window.showErrorMessage("No Parquet file selected");
      return;
    }
    webviewManager.createOrShow(parquetPath);
  });
}

async function getActiveParquetFilePath(): Promise<string | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.fileName.endsWith(".parquet")) {
    return editor.document.fileName;
  }
  const selectedFiles = await vscode.window.showOpenDialog({
    filters: { "Parquet Files": ["parquet"] },
    canSelectMany: false,
  });
  return selectedFiles?.[0]?.fsPath;
}
