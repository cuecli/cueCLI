# Changelog

## 1.3.99 – Preview-first UX, Guardrails, Snippets

This release focuses on a safer, clearer, and more consistent experience across the core commands.

- Preview-first + copy-first
  - `get`, `add`, and `edit` now show a numbered preview first (default 10 lines), then copy to clipboard (or print with a clear fallback message), and display a concise directive summary with a single Enter/Esc prompt in TTY. Non‑TTY and machine outputs remain clean for scripts.

- Guarded execution
  - `--execute` only runs truly executable prompts (shebang/metadata). Markdown/prose are hard‑blocked with a clear message and exit code 1. Executable prompts confirm in TTY: “About to run this prompt via <runner>. Run? [y/N]”.

- List improvements
  - Header “cueCLI Prompt List Below”; interactive, numbered in TTY. Each item shows a 3‑line snippet: if a description exists, 1 description + first 2 content lines; otherwise, first 3 content lines. Width‑aware truncation; tags and modified time preserved. Non‑TTY shows a non‑interactive snapshot.

- Descriptions
  - `--desc <text>` on `add` and `edit` to set/update prompt descriptions (shown in `list`).

- Machine‑safe outputs
  - `--pipe`, `--output`, and non‑TTY + `--stdout` suppress preview/summary for clean pipelines. `--file`/`--append` write exact content and log plain success messages.

- Sanitization clarity
  - Always scans; sanitizes by default unless `--raw`. `--scan-only` reports findings without modifying output. Messages aligned in README.

- Breaking change
  - Default `add`/`get`/`edit` no longer show the old “present for execution” UI. Execution requires explicit `--execute` and confirmation (TTY) for executable content.

Built with Codex and ClaudeCode. Author: Alex Kisin.

All notable changes to cueCli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive configuration management system
- Logger utility with multiple log levels
- Test suite with storage tests
- GitHub Actions CI/CD workflows
- Contributing guidelines
- MIT License

### Changed
- Enhanced README with complete documentation
- Improved error handling throughout the application
- Updated package.json with dev dependencies and scripts

### Security
- No hardcoded secrets or API keys
- Secure storage in user home directory

## [0.1.0] - 2025-01-04

### Added
- Initial release
- Basic `get`, `list`, and `add` commands
- Variable substitution support
- Tag-based organization
- Clipboard integration
- Automatic backup system
- Local storage in `~/.cuecli/`

### Features
- Fast execution (<100ms)
- Zero network dependencies
- Cross-platform support (macOS, Linux, Windows)

---

## Roadmap

### Next Release (0.2.0)
- [ ] Edit command for modifying existing prompts
- [ ] Import/Export functionality
- [ ] Config command for managing settings


