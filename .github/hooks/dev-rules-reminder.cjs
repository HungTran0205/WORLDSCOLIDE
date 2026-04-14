#!/usr/bin/env node
/**
 * Development Rules Reminder - Simplified Version
 * 
 * Minimal hook for injecting development rules and modularization reminders
 * to user prompts. Prevents duplicate injection by checking transcript history.
 * 
 * Features:
 * - Inject development rules path
 * - Inject modularization reminders
 * - Prevent duplicate injection
 * 
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Marker text to detect recent injection (must be unique)
const INJECTION_MARKER = '[IMPORTANT] Consider Modularization';

// How far back to check in transcript (lines)
const TRANSCRIPT_CHECK_LINES = 150;

// Rules file locations to check (in priority order)
const RULES_PATHS = [
  '.github/rules/development-rules.md',
  '.claude/rules/development-rules.md',
  'docs/development-rules.md'
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if context was recently injected to prevent duplicates
 * @param {string} transcriptPath - Path to transcript file
 * @returns {boolean} true if recently injected
 */
function wasRecentlyInjected(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      return false;
    }

    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    const recentLines = transcript.split('\n').slice(-TRANSCRIPT_CHECK_LINES);
    
    return recentLines.some(line => line.includes(INJECTION_MARKER));
  } catch (e) {
    // On error, assume not injected (better to inject than skip)
    return false;
  }
}

/**
 * Find development rules file
 * @returns {string|null} Rules file path or null
 */
function findRulesFile() {
  for (const rulesPath of RULES_PATHS) {
    const fullPath = path.join(process.cwd(), rulesPath);
    if (fs.existsSync(fullPath)) {
      return rulesPath;
    }
  }
  return null;
}

/**
 * Build injection content
 * @returns {string} Content to inject
 */
function buildInjectionContent() {
  const lines = [];
  
  // Rules section
  const rulesPath = findRulesFile();
  if (rulesPath) {
    lines.push('## Rules');
    lines.push(`- Read and follow development rules: "${rulesPath}"`);
    lines.push(`- Follow **YAGNI (You Aren't Gonna Need It) - KISS (Keep It Simple, Stupid) - DRY (Don't Repeat Yourself)** principles`);
    lines.push('');
  }
  
  // Modularization reminders
  lines.push('## **[IMPORTANT] Consider Modularization:**');
  lines.push('- If a code file exceeds 200 lines of code, consider modularizing it');
  lines.push('- Check existing modules before creating new');
  lines.push('- Analyze logical separation boundaries (functions, classes, concerns)');
  lines.push('- Use kebab-case naming with long descriptive names for file naming');
  lines.push('- Write descriptive code comments');
  lines.push('- After modularization, continue with main task');
  lines.push('- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, environment variables files, etc.');
  lines.push('');
  
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    // Read stdin payload
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) {
      process.exit(0);
    }

    // Parse payload
    const payload = JSON.parse(stdin);
    
    // Check for recent injection
    if (wasRecentlyInjected(payload.transcript_path)) {
      process.exit(0);
    }

    // Build and output injection content
    const content = buildInjectionContent();
    console.log(content);
    
    process.exit(0);
  } catch (error) {
    // Fail silently to avoid blocking user workflow
    console.error(`Dev rules hook error: ${error.message}`);
    process.exit(0);
  }
}

// Crash wrapper for production safety
try {
  main();
} catch (e) {
  // Minimal crash logging
  try {
    const logDir = path.join(__dirname, '.logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(
      path.join(logDir, 'hook-log.jsonl'),
      JSON.stringify({
        ts: new Date().toISOString(),
        hook: path.basename(__filename, '.cjs'),
        status: 'crash',
        error: e.message
      }) + '\n'
    );
  } catch (_) {
    // Silent fail - don't break user workflow
  }
  process.exit(0); // fail-open
}
