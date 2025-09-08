import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import storage from '../storage/local.js';
import { substituteVariables, parseVariables } from '../utils/template.js';
import sanitizer from '../utils/sanitizer.js';
import logger from '../utils/logger.js';
import executor from '../core/executor.js';
import { copyToClipboardSilent } from '../utils/clipboard.js';
import { showDirectiveSummary, showPreview } from '../utils/ux.js';

/**
 * Enhanced get command with multiple output options and sanitization
 */
export async function getCommand(name, options) {
  const startTime = Date.now();

  try {
    // Get the prompt
    const prompt = storage.getPrompt(name);
    
    if (!prompt) {
      console.error(chalk.red(`Error: Prompt '${name}' not found`));
      console.log(chalk.gray('Run `cuecli list` to see available prompts'));
      process.exit(1);
    }

    let content = prompt.content || '';

    // Handle variable substitution if provided
    if (options.vars && options.vars.length > 0) {
      const variables = parseVariables(options.vars);
      content = substituteVariables(content, variables);
    }

    // Always scan for sensitive data
    const findings = sanitizer.scan(content);
    
    // Sanitize by default unless --raw flag is used
    if (!options.raw && findings.length > 0) {
      // Sanitize the content
      content = sanitizer.sanitize(content);
      const stats = sanitizer.getStats();
      
      if (stats.totalRedacted > 0) {
        console.log(chalk.yellow(`🔒 Sanitized ${stats.totalRedacted} sensitive item(s) for safety`));
        if (options.verbose || options.scanOnly) {
          Object.entries(stats.byType).forEach(([type, count]) => {
            console.log(chalk.gray(`  - ${type}: ${count}`));
          });
        }
        console.log(chalk.gray('  Use --raw flag to bypass sanitization'));
      }
    } else if (options.raw && findings.length > 0) {
      // Warning when using raw with sensitive data
      console.log(chalk.red('⚠️  WARNING: Output contains sensitive data'));
      findings.forEach(f => {
        console.log(chalk.yellow(`  - ${f.type}: ${f.count} occurrence(s)`));
      });
    }

    // Detection & guardrails
    const hasShebang = detectShebang(content);
    const isExecutable = hasShebang || prompt?.executable === true;

    // Handle explicit execution flag (power users)
    if (options.execute) {
      if (!isExecutable) {
        console.error('This prompt is non-executable content. Use --stdout or --file.');
        process.exit(1);
      }
      // Only execute on explicit confirmation in TTY
      if (process.stdout.isTTY) {
        const runner = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
        const confirmed = await confirmOneLine(`About to run this prompt via ${runner}. Run? [y/N]`);
        if (confirmed) {
          await executor.execute(content, name);
        }
      }
      return;
    }

    const isMachineOutput = options.pipe || !!options.output || (!process.stdout.isTTY && options.stdout === true);
    const shouldPreviewByDefault = options.preview || !isMachineOutput;

    if (shouldPreviewByDefault) {
      const previewLines = (options.lines && Number(options.lines)) || 10;
      showPreview(name, content, previewLines);
    }

    // Handle different output methods (no execution by default)
    if (options.output) {
      await handleOutput(content, options.output, name);
    } else if (options.stdout) {
      // Output to stdout
      console.log(content);
      if (!isMachineOutput) {
        await showDirectiveSummary({ name, content, tags: prompt?.tags || [], variables: prompt?.variables || [] });
      }
    } else if (options.file) {
      // Save to file
      const filePath = path.resolve(options.file);
      await fs.writeFile(filePath, content);
      console.log(`Saved to ${filePath}`);
      if (!isMachineOutput) {
        await showDirectiveSummary({ name, content, tags: prompt?.tags || [], variables: prompt?.variables || [] });
      }
    } else if (options.append) {
      // Append to file
      const filePath = path.resolve(options.append);
      await fs.appendFile(filePath, '\n' + content);
      console.log(`Appended to ${filePath}`);
      if (!isMachineOutput) {
        await showDirectiveSummary({ name, content, tags: prompt?.tags || [], variables: prompt?.variables || [] });
      }
    } else if (options.pipe) {
      // Output for piping (no formatting)
      process.stdout.write(content);
    } else {
      // DEFAULT: Copy to clipboard; fallback to stdout
      const copied = await copyToClipboardSilent(content);
      if (copied) {
        console.log(`Copied ${name} to clipboard.`);
      } else {
        console.log('Clipboard unavailable; printing to stdout. Copy manually.');
        console.log(content);
      }
      if (!isMachineOutput) {
        await showDirectiveSummary({ name, content, tags: prompt?.tags || [], variables: prompt?.variables || [] });
      }
    }

    // Log usage for analytics (if enabled in future)
    // Note: Telemetry disabled by default for privacy
    logger.trace('Prompt retrieved', {
      name,
      method: options.stdout ? 'stdout' : options.file ? 'file' : options.append ? 'append' : options.pipe ? 'pipe' : options.output ? `format:${options.output}` : 'clipboard',
      sanitized: !options.raw,
      elapsed: Date.now() - startTime,
    });

  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    logger.error('Get command failed', { error: error.message });
    process.exit(1);
  }
}

/**
 * Handle special output formats
 */
async function handleOutput(content, format, name) {
  switch (format) {
  case 'json':
    console.log(JSON.stringify({
      name,
      content,
      timestamp: new Date().toISOString(),
    }, null, 2));
    break;
      
  case 'markdown':
    console.log(`# ${name}\n\n${content}`);
    break;
      
  case 'html': {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${name}</title>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <pre>${escapeHtml(content)}</pre>
  <footer>
    <small>Generated by cueCli at ${new Date().toISOString()}</small>
  </footer>
</body>
</html>`;
    console.log(html);
    break;
  }
      
  case 'base64':
    console.log(Buffer.from(content).toString('base64'));
    break;
      
  case 'url':
    console.log(encodeURIComponent(content));
    break;
      
  default:
    console.log(content);
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Helpers
function detectShebang(content) {
  const lines = content.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length === 0) continue;
    return line.startsWith('#!');
  }
  return false;
}

async function confirmOneLine(message) {
  return await new Promise(resolve => {
    process.stdout.write(`${message} `);
    const onData = buf => {
      const input = buf.toString().trim().toLowerCase();
      process.stdin.pause();
      process.stdin.off('data', onData);
      resolve(input === 'y' || input === 'yes');
    };
    process.stdin.resume();
    process.stdin.once('data', onData);
  });
}
