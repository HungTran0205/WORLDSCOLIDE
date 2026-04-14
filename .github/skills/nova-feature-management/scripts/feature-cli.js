#!/usr/bin/env node
/**
 * Feature CLI - Main entry point for feature management commands
 *
 * Usage:
 *   node feature-cli.js <command> [arguments]
 *
 * Commands:
 *   create <path>       Create a new feature
 *   switch <path>       Switch to an existing feature
 *   list [category]     List features (tree view, optional filter)
 *   status              Show current active feature
 *   help [command]      Show help for commands
 */

const { createFeature } = require('./create')
const { switchFeature } = require('./switch')
const { listFeatures } = require('./list')
const { getStatus } = require('./status')
const { getHelp } = require('./help')

/**
 * Main CLI router
 */
function main () {
  const args = process.argv.slice(2)
  const command = args[0]
  const commandArgs = args.slice(1)

  if (!command) {
    console.log(JSON.stringify({
      success: false,
      error: 'No command specified. Use "help" to see available commands.',
      code: 'NO_COMMAND',
      availableCommands: ['create', 'switch', 'list', 'status', 'help']
    }, null, 2))
    process.exit(1)
  }

  let result

  switch (command.toLowerCase()) {
    case 'create':
      if (commandArgs.length === 0) {
        result = {
          success: false,
          error: 'Missing feature path. Usage: feature-cli.js create <path>',
          code: 'MISSING_ARGS'
        }
      } else {
        result = createFeature(commandArgs[0])
      }
      break

    case 'switch':
      if (commandArgs.length === 0) {
        result = {
          success: false,
          error: 'Missing feature path. Usage: feature-cli.js switch <path>',
          code: 'MISSING_ARGS'
        }
      } else {
        result = switchFeature(commandArgs[0])
      }
      break

    case 'list':
      result = listFeatures({
        category: commandArgs[0] || null
      })
      break

    case 'status':
      result = getStatus()
      break

    case 'help':
      result = getHelp(commandArgs[0] || null)
      break

    default:
      result = {
        success: false,
        error: `Unknown command: ${command}`,
        code: 'UNKNOWN_COMMAND',
        availableCommands: ['create', 'switch', 'list', 'status', 'help']
      }
  }

  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

// Run CLI
main()
