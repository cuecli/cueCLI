import chalk from 'chalk';
import fs from 'fs-extra';
import readline from 'readline';
import storage from '../storage/local.js';
import { readFromClipboard, copyToClipboardSilent } from '../utils/clipboard.js';
import { extractVariables } from '../utils/template.js';
import { showDirectiveSummary, showPreview } from '../utils/ux.js';

export async function addCommand(name, options) {
  try {
    // Check if prompt already exists
    if (storage.promptExists(name)) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question(chalk.yellow(`Prompt '${name}' already exists. Overwrite? (y/N): `), resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(chalk.gray('Cancelled'));
        return;
      }
    }

    let content = '';

    // Get content from different sources
    if (options.fromFile) {
      // Read from file
      if (!fs.existsSync(options.fromFile)) {
        console.error(chalk.red(`Error: File '${options.fromFile}' not found`));
        process.exit(1);
      }
      content = fs.readFileSync(options.fromFile, 'utf8');
      console.log(chalk.gray(`Reading from ${options.fromFile}...`));
    } else if (options.fromClipboard) {
      // Read from clipboard
      content = await readFromClipboard();
      console.log(chalk.gray('Reading from clipboard...'));
    } else {
      // Read from stdin (multi-line input)
      console.log(chalk.gray('Enter prompt content (Ctrl+D or Ctrl+C when done):'));
      content = await readFromStdin();
    }

    if (!content || content.trim().length === 0) {
      console.error(chalk.red('Error: Prompt content cannot be empty'));
      process.exit(1);
    }

    // Extract variables from content
    const variables = extractVariables(content);

    // Prepare prompt data
    const promptData = {
      content,
      tags: options.tags || [],
      variables,
      description: options.desc || undefined
    };

    // Save the prompt
    storage.setPrompt(name, promptData);

    // Preview-first (always show; in non-TTY there is no keypress prompt later)
    showPreview(name, content, 10);
    // Copy-first UX for newly added prompts
    const copied = await copyToClipboardSilent(content);
    if (copied) {
      console.log(`Copied ${name} to clipboard. Paste into your assistant.`);
    } else {
      console.log('Clipboard unavailable; printing to stdout. Copy manually.');
      console.log(content);
    }

    await showDirectiveSummary({
      name,
      content,
      tags: promptData.tags,
      variables: promptData.variables,
    });
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function readFromStdin() {
  return new Promise((resolve, _reject) => {
    let content = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', line => {
      content += line + '\n';
    });

    rl.on('close', () => {
      resolve(content.trim());
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      rl.close();
      resolve(content.trim());
    });
  });
}
