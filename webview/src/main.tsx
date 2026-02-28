import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { FocusStyleManager } from '@blueprintjs/core';
import App from './App';

FocusStyleManager.onlyShowFocusOnTabs();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(React.createElement(React.StrictMode, null, React.createElement(App, null)));
