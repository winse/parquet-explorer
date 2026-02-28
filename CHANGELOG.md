# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-03-01

### Changed

- Migrated Parquet webview UI to shared `data-viewer` component library (aligned with `avro-explorer`)
- Updated build pipeline to compile shared `data-viewer` before extension bundling
- Synced webview package metadata and dependency usage for shared UI integration

### Documentation

- Updated README architecture and development sections to reflect shared `data-viewer` usage
- Removed outdated webview structure descriptions from README

## [0.2.1] - 2026-02-26

### Added

- Timestamp formatting with customizable format string in settings
- Support for multiple timestamp units (nanoseconds, microseconds, milliseconds, seconds)
- Improved timestamp type detection for Arrow/Parquet data types

### Changed

- Default timestamp format: `YYYY-MM-DD HH:mm:ss.SSS`
- Users can configure format via `parquet-explr.timestampFormat` setting

### Fixed

- Timestamp fields now display formatted datetime strings instead of raw numeric values
- Better handling of various timestamp representations from parquet-wasm

## [0.2.0] - 2025-02-11

### Changed

- ZSTD compression support via parquet-wasm
- Optimized display for narrow containers

### Fixed

- Packaging issue with parquet-wasm binary not being included in VSIX
- Automatic copy of parquet_wasm_bg.wasm to dist folder during build

## [0.1.2]

### Added

- Initial release with basic parquet viewing capabilities
- Interactive data table with pagination
- Schema display panel
- CSV and JSON export functionality
- Theme support (light/dark mode)