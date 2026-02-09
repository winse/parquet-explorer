import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { FocusStyleManager } from '@blueprintjs/core';
import App from './App';

FocusStyleManager.onlyShowFocusOnTabs();

declare global {
  interface Window {
    acquireVsCodeApi: () => { postMessage: (message: unknown) => void; getState: () => unknown; setState: (state: unknown) => void; };
    vscode: { postMessage: (message: unknown) => void; };
  }
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(React.createElement(React.StrictMode, null, React.createElement(App, null)));
