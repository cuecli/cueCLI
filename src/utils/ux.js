import chalk from 'chalk';
import readline from 'readline';

/**
 * Show a consistent directive summary with optional Enter/Esc handling.
 * - Always prints the summary.
 * - If TTY, prints "Press Enter to continue; press Esc to clear." and
 *   clears only the printed summary lines on Esc.
 */
export async function showDirectiveSummary({ name, content, tags = [], variables = [] }) {
  const lines = content.split('\n');
  const lineCount = lines.length;
  const charCount = content.length;

  let printed = 0;
  const log = (msg = '') => { console.log(msg); printed++; };

  // Summary block
  log(chalk.cyan('Summary'));
  log(chalk.white('  Name:    ') + chalk.yellow(name));
  if (tags && tags.length > 0) {
    log(chalk.white('  Tags:    ') + tags.join(', '));
  }
  if (variables && variables.length > 0) {
    log(chalk.white('  Vars:    ') + variables.join(', '));
  }
  log(chalk.white('  Metrics: ') + chalk.gray(`${lineCount} lines • ${charCount} chars`));
  log(chalk.gray('Use this as a directive in your AI assistant.'));

  if (!process.stdout.isTTY) {
    return; // Non-TTY: do not wait for keypress
  }

  const promptLine = 'Press Enter to continue; press Esc to clear.';
  log(chalk.gray(promptLine));

  await new Promise(resolve => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    const onKey = (_str, key) => {
      if (!key) return;
      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        resolve();
        return;
      }
      if (key.name === 'escape') {
        // Clear printed lines (summary + prompt)
        for (let i = 0; i < printed; i++) {
          process.stdout.write('\x1b[1A'); // cursor up
          process.stdout.write('\x1b[2K'); // erase line
        }
        cleanup();
        resolve();
      }
    };
    const cleanup = () => {
      process.stdin.removeListener('keypress', onKey);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
    };
    process.stdin.on('keypress', onKey);
    process.stdin.resume();
  });
}

/**
 * Show a numbered content preview with a header and separator.
 */
export function showPreview(name, content, linesToShow = 10) {
  const lines = content.split('\n');
  const count = Math.max(0, Math.min(linesToShow, lines.length));
  console.log(chalk.cyan(`Preview of '${name}':`));
  console.log(chalk.gray('─'.repeat(50)));
  for (let i = 0; i < count; i++) {
    console.log(chalk.gray(`${String(i + 1).padStart(3)} │`), lines[i] ?? '');
  }
  if (lines.length > count) {
    console.log(chalk.gray(`... (${lines.length - count} more lines)`));
  }
  console.log(chalk.gray('─'.repeat(50)));
}

export default { showDirectiveSummary };
