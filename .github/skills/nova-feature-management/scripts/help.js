#!/usr/bin/env node
/**
 * Help script
 * Displays command reference for feature management
 */

const COMMANDS = {
  create: {
    usage: '@feature create <path>',
    description: 'Create a new feature at the specified path',
    examples: [
      '@feature create my-feature',
      '@feature create auth/login',
      '@feature create core/auth/two-factor'
    ],
    arguments: {
      '<path>': 'Feature path using lowercase letters, numbers, hyphens, underscores. Use / to create in a category.'
    },
    notes: [
      'Creates the feature directory under specs/',
      'Initializes requirements.md from template',
      'Automatically sets the new feature as active'
    ]
  },
  switch: {
    usage: '@feature switch <path>',
    description: 'Switch to an existing feature',
    examples: [
      '@feature switch my-feature',
      '@feature switch auth/login'
    ],
    arguments: {
      '<path>': 'Path to an existing feature'
    },
    notes: [
      'Feature must exist (have at least requirements.md, design.md, or tasks.md)',
      'Updates active-feature.json with new context'
    ]
  },
  list: {
    usage: '@feature list [category]',
    description: 'List all features in tree view format',
    examples: [
      '@feature list',
      '@feature list auth'
    ],
    arguments: {
      '[category]': 'Optional category to filter results'
    },
    notes: [
      'Shows features and categories in a tree structure',
      'Displays which spec files exist for each feature'
    ]
  },
  status: {
    usage: '@feature status',
    description: 'Show current active feature context',
    examples: [
      '@feature status'
    ],
    arguments: {},
    notes: [
      'Shows the currently active feature',
      'Displays feature files and last modified time',
      'Indicates if the active feature state is stale'
    ]
  },
  help: {
    usage: '@feature help [command]',
    description: 'Show help for feature commands',
    examples: [
      '@feature help',
      '@feature help create'
    ],
    arguments: {
      '[command]': 'Specific command to get help for'
    },
    notes: [
      'Without argument, shows all available commands',
      'With argument, shows detailed help for that command'
    ]
  }
}

/**
 * Gets help content
 * @param {string} [command] - Specific command to get help for
 * @returns {{success: boolean, data: object}}
 */
function getHelp (command = null) {
  if (command) {
    const cmd = COMMANDS[command.toLowerCase()]
    if (!cmd) {
      return {
        success: false,
        error: `Unknown command: ${command}. Available: ${Object.keys(COMMANDS).join(', ')}`,
        code: 'UNKNOWN_COMMAND'
      }
    }

    return {
      success: true,
      data: {
        command: command.toLowerCase(),
        ...cmd
      }
    }
  }

  // Return all commands
  return {
    success: true,
    data: {
      commands: Object.entries(COMMANDS).map(([name, info]) => ({
        name,
        usage: info.usage,
        description: info.description
      })),
      summary: formatHelpSummary()
    }
  }
}

/**
 * Formats help summary for display
 * @returns {string}
 */
function formatHelpSummary () {
  const lines = [
    'Feature Management Commands',
    '===========================',
    ''
  ]

  Object.entries(COMMANDS).forEach(([name, info]) => {
    lines.push(`${info.usage}`)
    lines.push(`  ${info.description}`)
    lines.push('')
  })

  lines.push('Path Format:')
  lines.push('  - Lowercase letters, numbers, hyphens, underscores')
  lines.push('  - Use / to organize into categories')
  lines.push('  - Examples: my-feature, auth/login, core/auth/two-factor')

  return lines.join('\n')
}

/**
 * Formats detailed command help for display
 * @param {object} commandInfo - Command info from getHelp
 * @returns {string}
 */
function formatCommandHelp (commandInfo) {
  const lines = [
    `@feature ${commandInfo.command}`,
    '='.repeat(`@feature ${commandInfo.command}`.length),
    '',
    `Usage: ${commandInfo.usage}`,
    '',
    commandInfo.description,
    ''
  ]

  if (Object.keys(commandInfo.arguments).length > 0) {
    lines.push('Arguments:')
    Object.entries(commandInfo.arguments).forEach(([arg, desc]) => {
      lines.push(`  ${arg}: ${desc}`)
    })
    lines.push('')
  }

  if (commandInfo.examples.length > 0) {
    lines.push('Examples:')
    commandInfo.examples.forEach(ex => {
      lines.push(`  ${ex}`)
    })
    lines.push('')
  }

  if (commandInfo.notes.length > 0) {
    lines.push('Notes:')
    commandInfo.notes.forEach(note => {
      lines.push(`  • ${note}`)
    })
  }

  return lines.join('\n')
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0] || null

  const result = getHelp(command)
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

module.exports = { getHelp, COMMANDS, formatHelpSummary, formatCommandHelp }
