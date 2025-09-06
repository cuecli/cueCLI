#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';

// Import commands
import { getCommand } from '../src/commands/enhanced-get.js';
import { listCommand } from '../src/commands/list.js';
import { addCommand } from '../src/commands/add.js';
import { editCommand } from '../src/commands/edit.js';
import { exportCommand, importCommand } from '../src/commands/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

program
  .name('cuecli')
  .description('CLI tool for managing reusable prompts')
  .version(packageJson.version);

// Get command (enhanced)
program
  .command('get <name>')
  .description('Copy prompt to clipboard and display it')
  .option('--vars <vars...>', 'Variables to substitute (format: KEY=value)')
  .option('--stdout', 'Output to stdout instead of clipboard')
  .option('--file <path>', 'Save to file')
  .option('--append <path>', 'Append to file')
  .option('--pipe', 'Output for piping (no formatting)')
  .option('--preview', 'Preview prompt with line numbers')
  .option('--lines <n>', 'Number of lines to preview (default: 10)')
  .option('--output <format>', 'Output format: json, markdown, html, base64, url')
  .option('--raw', 'Output raw content without sanitization (security risk)')
  .option('--scan-only', 'Only show what would be sanitized')
  .option('--execute', 'Execute the prompt as a command after confirmation')
  .option('-v, --verbose', 'Show detailed information')
  .action(getCommand);

// List command
program
  .command('list')
  .alias('ls')
  .description('List all prompts')
  .option('--tags <tags...>', 'Filter by tags')
  .option('--json', 'Output as JSON')
  .option('-i, --interactive', 'Force interactive selection mode')
  .option('--no-interactive', 'Disable interactive selection mode')
  .action(listCommand);

// Add command
program
  .command('add <name>')
  .description('Add a new prompt')
  .option('--from-file <path>', 'Add prompt from file')
  .option('--from-clipboard', 'Add prompt from clipboard')
  .option('--tags <tags...>', 'Add tags to prompt')
  .action(addCommand);

// Edit command
program
  .command('edit <name>')
  .description('Edit an existing prompt in your editor')
  .option('--editor <editor>', 'Specify editor to use')
  .option('-v, --verbose', 'Show detailed information')
  .action(editCommand);

// Export command
program
  .command('export')
  .description('Export prompts to JSON or markdown')
  .option('--output <file>', 'Output file path')
  .option('--format <format>', 'Output format: json (default) or markdown')
  .option('--prompts <names...>', 'Export specific prompts only')
  .option('--raw', 'Export without sanitization (includes sensitive data)')
  .option('--force', 'Overwrite existing file')
  .option('-v, --verbose', 'Show detailed export information')
  .action(exportCommand);

// Import command
program
  .command('import <file>')
  .description('Import prompts from JSON file')
  .option('--merge', 'Merge with existing prompts')
  .option('--overwrite', 'Overwrite existing prompts')
  .option('-v, --verbose', 'Show detailed import information')
  .action(importCommand);

// Delete command
program
  .command('delete <name>')
  .alias('rm')
  .description('Delete a prompt')
  .action(async name => {
    const { default: storage } = await import('../src/storage/local.js');
    const { default: executor } = await import('../src/core/executor.js');
    
    // Check if prompt exists
    if (!storage.promptExists(name)) {
      console.error(chalk.red(`Error: Prompt '${name}' not found`));
      process.exit(1);
    }
    
    // Verify intent before deleting
    const result = await executor.verifyAction('delete', name, async () => {
      if (storage.deletePrompt(name)) {
        console.log(chalk.green('✓'), `Deleted prompt '${name}'`);
        return true;
      }
      throw new Error('Failed to delete prompt');
    });
    
    if (!result.confirmed) {
      process.exit(0);
    }
  });

// Parse arguments
(async () => {
  await program.parseAsync(process.argv);
})();