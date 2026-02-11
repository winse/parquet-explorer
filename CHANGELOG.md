# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
