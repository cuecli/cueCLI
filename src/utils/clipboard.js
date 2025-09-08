import clipboardy from 'clipboardy';
import chalk from 'chalk';

export async function copyToClipboard(text) {
  try {
    await clipboardy.write(text);
    return true;
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not access clipboard'));
    console.warn(chalk.gray('Falling back to stdout...'));
    return false;
  }
}

export async function readFromClipboard() {
  try {
    const text = await clipboardy.read();
    return text;
  } catch (error) {
    throw new Error('Could not read from clipboard. Please ensure clipboard access is allowed.');
  }
}

// Silent variant used by get flow to avoid double/fuzzy messaging
export async function copyToClipboardSilent(text) {
  try {
    await clipboardy.write(text);
    return true;
  } catch {
    return false;
  }
}
