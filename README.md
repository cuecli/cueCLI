# cueCLI - AI Prompt Management CLI Tool for ChatGPT, Claude & More

<div align="center">

[![npm version](https://img.shields.io/npm/v/cuecli.svg)](https://www.npmjs.com/package/cuecli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/cuecli.svg)](https://nodejs.org)

**Manage, organize, and reuse your AI prompts from the command line**

[🌐 Website](https://cuecli.com) • [📖 Documentation](https://cuecli.com/docs) • [🐛 Issues](https://github.com/cuecli/cueCLI/issues) • [📦 NPM](https://www.npmjs.com/package/cuecli)

</div>

## 📌 Overview

cueCLI is a command-line tool for managing, organizing, and reusing AI prompts across ChatGPT, Claude, and other assistants. Store frequently-used prompts locally, organize them with tags, and retrieve them instantly. No more copy-pasting from text files or losing prompts in chat history.

## Why cueCLI?

Managing prompts across AI chat sessions is messy. Copy-pasting leads to drift, sharing with teams is difficult, and sensitive data needs sanitization. cueCLI solves this by giving you a local prompt library with instant access, smart organization, and built-in safety features. Store once, use everywhere.

**Perfect for:**
- Developers using ChatGPT, Claude, or other AI assistants daily
- Teams needing consistent AI interactions across projects
- Anyone tired of losing or re-writing prompts
- Prompt engineers building reusable templates

### Key Features

- **Prompt Storage** - Save and organize reusable prompts locally
- **Instant Retrieval** - Get any prompt to clipboard in under 100ms  
- **Tag Organization** - Categorize prompts for easy discovery
- **Variable Substitution** - Create dynamic templates with placeholders
- **Built-in Sanitization** - Automatically detect and remove sensitive data
- **Backup System** - Automatic backups of your prompt library
- **Command Execution** - Optionally execute prompts as shell commands
- **Cross-platform** - Works on macOS, Linux, and Windows

## Installation

### Via npm (recommended)

```bash
npm install -g cuecli
```

### From source

```bash
git clone https://github.com/cuecli/cueCLI
cd cuecli
npm install
npm link
```

## Quick Start

```bash
# Save a frequently-used prompt
cuecli add context --from-file README.md --tags project docs

# Get it back instantly (preview → copy)
cuecli get context

# List all your saved prompts
cuecli list

# Use variables for dynamic prompts
cuecli get api-test --vars API_KEY="..." ENV="staging"

# Execute command prompts safely (optional)
cuecli get deploy-script --execute
```

## Core Commands

### `cuecli get <name>`
Preview-first, then copy-first. In TTY, cueCLI shows a numbered preview (default 10 lines), copies the prompt (or prints it with a clear fallback message), and displays a concise directive summary with a single prompt: “Press Enter to continue; press Esc to clear.” In non‑TTY or machine modes, preview/summary are suppressed for clean output.

Options:
- `--vars KEY=value...` - Substitute template variables
- `--stdout` - Print to terminal (in non‑TTY suppresses preview/summary)
- `--pipe` - Raw output for piping (no preview/summary)
- `--file <path>` - Save exact content to file (prints “Saved to <abs_path>”)
- `--append <path>` - Append exact content to file (prints “Appended to <abs_path>”)
- `--preview` / `--lines <n>` - Show preview first; default 10 lines (TTY)
- `--output <format>` - json | markdown | html | base64 | url (machine output)
- `--execute` - Only executes truly executable content (shebang or metadata) with confirm: “About to run this prompt via <runner>. Run? [y/N]”. Non‑executable (Markdown/prose) is hard‑blocked.
- `--raw` / `--scan-only` - Sanitization controls (see below)

### `cuecli add <name>`
Save a new prompt to your library. After saving, cueCLI shows preview → copy (or fallback print) → directive summary with a single Enter/Esc prompt in TTY.

Options:
- `--from-file <path>` - Import from file
- `--from-clipboard` - Import from clipboard  
- `--desc <text>` - Set a short description (shown in list)
- `--tags <tags...>` - Add tags for organization

### `cuecli list`
Display all saved prompts with metadata. In TTY, list is numbered and interactive: type an index to retrieve and see the same preview → copy/summary flow. Non‑TTY shows a non‑interactive snapshot.

Options:
- `--tags <tags...>` - Filter by tags
- `--json` - Output as JSON

### `cuecli edit <name>`
Edit an existing prompt in your default editor. After saving, cueCLI shows preview → copy (or fallback print) → directive summary with a single Enter/Esc prompt in TTY.

Options:
- `--editor <editor>` - Use specific editor
- `--desc <text>` - Update description without opening editor

### `cuecli export`
Export your prompt library for backup or sharing. For safety, export asks for a one‑line confirmation before writing.

Options:
- `--output <file>` - Output file path
- `--raw` - Export without sanitization (includes sensitive data)
- `--format <format>` - Output format (json, markdown)

## Template Variables

Create reusable templates with variables using `{{VARIABLE}}` or `${VARIABLE}` syntax:

```markdown
Project: {{PROJECT_NAME}}
Environment: ${ENV}
API Endpoint: {{API_URL}}
```

Then substitute when retrieving:
```bash
cuecli get api-template --vars PROJECT_NAME="MyAPI" ENV=staging API_URL="https://api.example.com"
```


## Data Sanitization

Protect sensitive information with built-in sanitization:

```bash
#!/usr/bin/env bash
# Scan for sensitive data without modifying
cuecli get my-prompt --scan-only

# Bypass sanitization (raw)
cuecli get my-prompt --raw

# Export with or without sanitization (confirm when prompted)
cuecli export --output shared-prompts.json
cuecli export --raw --output shared-prompts.json
```

Automatically detects:
- API keys and tokens
- Passwords and credentials
- SSH private keys
- Credit card numbers
- Email addresses (optional)
- URLs with embedded credentials

## Configuration

cueCLI stores data in `~/.cuecli/`:

```
~/.cuecli/
├── config.json       # Global configuration
├── prompts.json      # Your prompt library
├── backups/          # Automatic backups
└── templates/        # Prompt templates
```

### Environment Variables

- `CUECLI_CONFIG_DIR` - Override default config directory
- `EDITOR` - Default editor for prompt editing
- `LOG_LEVEL` - Set logging level (ERROR, WARN, INFO, DEBUG)
- `NO_COLOR` - Disable colored output

## Built-in Universal Prompts

cueCLI comes with 6 universal prompts ready to use:

### 1. Strict Implementation (`strict-implementation`)
Ensures precise execution without assumptions or creative interpretations.
```bash
cuecli get strict-implementation
```

### 2. QA Simulation (`qa-simulation`)
Comprehensive "1000 users" testing audit for finding bugs and UX issues.
```bash
cuecli get qa-simulation
```

### 3. Precision Modification (`precision-modification`)
Surgical updates to existing systems with zero scope creep.
```bash
cuecli get precision-modification
```

### 4. Change Documentation (`change-documentation`)
Comprehensive documentation standards for all modifications.
```bash
cuecli get change-documentation
```

### 5. Single Screen Review (`single-screen-review`)
Deep dive analysis of a specific screen or component.
```bash
cuecli get single-screen-review
```

### 6. Progress Tracker (`progress-tracker`)
Comprehensive task tracking and documentation for multi-step projects.
```bash
cuecli get progress-tracker
```

### Usage Guidelines

These prompts work best when:
- You need precise, accountable work with no surprises
- You're working with existing systems that shouldn't be disrupted
- You need comprehensive testing or review
- You require detailed documentation of changes
- You want to eliminate assumptions and ensure exact execution

## Examples

### Save and Use Project Context
```bash
# Add your project README as context
cuecli add project --from-file ./README.md --tags documentation

# Use it in your AI chat
cuecli get project
```

### Create Debug Template
```bash
# Create a reusable debug template
echo "Debug {{SERVICE}} at {{TIME}} with level {{LEVEL}}" | cuecli add debug --from-clipboard

# Use with different values
cuecli get debug --vars SERVICE=auth TIME="2025-01-04 14:00" LEVEL=verbose
```

### Share Sanitized Prompts with Team
```bash
# Export without sensitive data
cuecli export --output team-prompts.json

# Team member imports
cuecli import team-prompts.json
```

## Development

### Setup
```bash
git clone https://github.com/cuecli/cueCLI
cd cuecli
npm install
```

### Testing
Manual smoke checks (preview‑first, copy‑first, guardrails):
```bash
# Seed a prompt
cuecli add strict-implementation --from-file prompts/strict-implementation.md --desc "Strict-mode directive"

# List (interactive in TTY)
cuecli list

# Retrieve (preview → copy/print → summary)
cuecli get strict-implementation

# Non-executable guard (exit 1)
cuecli get --execute strict-implementation; echo $?
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © 2025 Alex Kisin

## Support

- **Documentation**: [cuecli.com/docs](https://cuecli.com/docs)
- **Issues**: [GitHub Issues](https://github.com/cuecli/cueCLI/issues)
- **Email**: alex@cuecli.com

## ☕ Support cueCLI

Enjoying cueCLI? Consider buying me a coffee to keep this project going!

<a href="https://www.buymeacoffee.com/akisin" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" width="210">
</a>

Your support helps maintain and improve cueCLI for everyone. Thank you! 🙏

## Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Clipboardy](https://github.com/sindresorhus/clipboardy) - Clipboard access
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - File system utilities

---

✨ **Enjoy cueCLI!** It's been crafted with care to make your AI workflow smoother.  
If it's helped you, **star this repo** and share it with others!
