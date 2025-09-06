import chalk from 'chalk';
import readline from 'readline';
import storage from '../storage/local.js';
import { getCommand } from './enhanced-get.js';

export async function listCommand(options) {
  try {
    let prompts = storage.getAllPrompts();

    // Filter by tags if specified
    if (options.tags && options.tags.length > 0) {
      prompts = storage.getPromptsByTags(options.tags);
    }

    const promptEntries = Object.entries(prompts);

    if (promptEntries.length === 0) {
      if (options.tags) {
        console.log(chalk.yellow('No prompts found with the specified tags'));
      } else {
        console.log(chalk.yellow('No prompts found'));
        console.log(chalk.gray('Run `cuecli add <name>` to create your first prompt'));
      }
      return;
    }

    // Output as JSON if requested
    if (options.json) {
      console.log(JSON.stringify(prompts, null, 2));
      return;
    }

    // Check if we should run in interactive mode
    // Interactive by default unless JSON mode, explicitly disabled, or stdout is piped
    const isInteractive = (options.interactive || process.stdout.isTTY) && !options.noInteractive && !options.json && promptEntries.length > 0;

    // Display prompts in a formatted list
    console.log(chalk.bold(`\nFound ${promptEntries.length} prompt${promptEntries.length === 1 ? '' : 's'}:\n`));

    // Sort by name
    promptEntries.sort((a, b) => a[0].localeCompare(b[0]));

    // Display prompts with numbers if interactive
    for (let i = 0; i < promptEntries.length; i++) {
      const [name, prompt] = promptEntries[i];
      
      // Show number prefix in interactive mode
      if (isInteractive) {
        console.log(chalk.yellow(`[${i + 1}]`), chalk.cyan('•'), chalk.white(name), chalk.gray(`v${prompt.version || 1}`));
      } else {
        console.log(chalk.cyan('•'), chalk.white(name), chalk.gray(`v${prompt.version || 1}`));
      }
      
      // Content preview (first line or 50 chars)
      if (prompt.content) {
        const preview = prompt.content.split('\n')[0].substring(0, 50);
        const ellipsis = prompt.content.length > 50 || prompt.content.includes('\n') ? '...' : '';
        console.log(chalk.gray(`     ${preview}${ellipsis}`));
      }

      // Tags
      if (prompt.tags && prompt.tags.length > 0) {
        console.log(chalk.gray('     Tags:'), chalk.blue(prompt.tags.join(', ')));
      }

      // Variables
      if (prompt.variables && prompt.variables.length > 0) {
        console.log(chalk.gray('     Variables:'), chalk.magenta(prompt.variables.join(', ')));
      }

      // Last modified
      if (prompt.modified) {
        const date = new Date(prompt.modified);
        const relative = getRelativeTime(date);
        console.log(chalk.gray(`     Modified: ${relative}`));
      }

      console.log(); // Empty line between prompts
    }

    // Interactive selection mode
    if (isInteractive) {
      const selectionPrompt = `Select [1-${promptEntries.length}] and press Enter (or ESC/q to exit): `;
      console.log(chalk.green(selectionPrompt));
      
      // Set up readline for input
      readline.emitKeypressEvents(process.stdin);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
      
      // Return a promise for async handling
      return new Promise((resolve) => {
        let inputBuffer = '';
        const prompt = selectionPrompt; // Make prompt accessible in closure
        
        const handleKeypress = (str, key) => {
          // Handle ESC or q to exit
          if (key.name === 'escape' || (str === 'q' && inputBuffer === '')) {
            cleanup();
            console.log(chalk.gray('\nExited without selection'));
            resolve();
            return;
          }
          
          // Handle Ctrl+C
          if (key.ctrl && key.name === 'c') {
            cleanup();
            process.exit(0);
          }
          
          // Handle Enter key
          if (key.name === 'return') {
            const num = parseInt(inputBuffer);
            if (!isNaN(num) && num >= 1 && num <= promptEntries.length) {
              cleanup();
              const selectedName = promptEntries[num - 1][0];
              console.log(chalk.cyan(`\nExecuting: ${selectedName}\n`));
              
              // Execute the selected prompt
              getCommand(selectedName, { ...options, stdout: false });
              resolve();
              return;
            } else if (inputBuffer.length > 0) {
              // Invalid selection
              process.stdout.write('\r' + ' '.repeat(50) + '\r');
              process.stdout.write(chalk.red('Invalid selection. ') + chalk.green('Select [1-' + promptEntries.length + ']: '));
              inputBuffer = '';
            }
            return;
          }
          
          // Handle backspace
          if (key.name === 'backspace') {
            if (inputBuffer.length > 0) {
              inputBuffer = inputBuffer.slice(0, -1);
              process.stdout.write('\r' + chalk.green(prompt) + inputBuffer + ' \b');
            }
            return;
          }
          
          // Handle number input
          if (str && str >= '0' && str <= '9') {
            inputBuffer += str;
            process.stdout.write(str);
          }
        };
        
        const cleanup = () => {
          process.stdin.removeListener('keypress', handleKeypress);
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.pause();
        };
        
        process.stdin.on('keypress', handleKeypress);
        process.stdin.resume();
      });
    } else {
      // Footer with usage hint for non-interactive mode
      console.log(chalk.gray('Use `cuecli get <name>` to copy a prompt to clipboard'));
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else {
    return 'just now';
  }
}