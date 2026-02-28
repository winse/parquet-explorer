# Parquet Explorer

<div align="center">

![Parquet Explorer](images/logo.png)

A professional VS Code extension for viewing Apache Parquet files with an interactive interface.

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/winse.parquet-explr?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=winse.parquet-explr)
[![Open VSX](https://img.shields.io/open-vsx/v/winse/parquet-explr?label=Open%20VSX)](https://open-vsx.org/extension/winse/parquet-explr)

![UI Preview](images/ui.png)

</div>

## Features

- Interactive data table with sorting, filtering and pagination
- Schema display with field and JSON views
- CSV / JSON export
- Double-click `.parquet` files to open directly in VS Code
- VS Code theme aware UI
- parquet-wasm parser with ZSTD support
- Configurable timestamp/date formatting via settings
- Shared `data-viewer` UI library with Avro Explorer for consistent UX

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for `Parquet Explorer`
4. Click Install

### From VSIX Package

```bash
# Build the extension
npm run pkg

# Install the VSIX
code --install-extension parquet-explr-0.5.0.vsix
```

## Usage

### Open Parquet files

1. Double-click any `.parquet` file in Explorer
2. Or **right-click** -> **Open With...** -> `Parquet Explorer`
3. Or run command palette: `Open in Parquet Explorer`

### Main interface

- Schema panel: column names, types, and metadata
- Records panel: interactive table for row data
- Split/Schema/Records mode switching
- Export toolbar actions for CSV and JSON

## Settings

| Key | Default | Description |
| --- | --- | --- |
| `parquet-explr.timestampFormat` | `YYYY-MM-DD HH:mm:ss.SSS` | Timestamp display format |
| `parquet-explr.dateFormat` | `YYYY-MM-DD` | Date display format |

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.78+
- npm

### Setup

```bash
git clone https://github.com/winse/data-viewer

git clone https://github.com/winse/parquet-explr.git
cd parquet-explr
npm install
cd webview && npm install && cd ..
```

### Build and watch

```bash
# Dev build
npm run compile

# Watch mode
npm run watch

# Production build + VSIX
npm run pkg
```

### Architecture

- `parquet-explorer/src`: VS Code extension logic (editor provider, message handling, parquet processing)
- `parquet-explorer/webview/src`: lightweight React entry (`App.tsx`) consuming shared components
- `data-viewer/src`: shared UI components/hooks/styles used by Parquet Explorer and Avro Explorer

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run build:common` | Build shared `data-viewer` library |
| `npm run compile` | Build shared UI + type-check + bundle extension/webview |
| `npm run compile:prod` | Production build |
| `npm run watch` | Watch TypeScript and esbuild |
| `npm run pkg` | Build and package VSIX |

## Acknowledgments

- [Apache Parquet](https://parquet.apache.org/)
- [parquet-wasm](https://github.com/kylebarron/parquet-wasm)
- [BlueprintJS](https://blueprintjs.com/)