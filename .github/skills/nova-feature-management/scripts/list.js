#!/usr/bin/env node
/**
 * List features script
 * Lists all features in tree view format, optionally filtered by category
 */

const { normalizePath } = require('./utils/paths')
const { buildTree, formatTreeAsString } = require('./utils/discovery')

/**
 * Lists features in tree or list format
 * @param {object} [options] - Options
 * @param {string} [options.category] - Category to filter by
 * @param {string} [options.workspaceRoot] - Workspace root directory
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function listFeatures (options = {}) {
  const workspaceRoot = options.workspaceRoot || process.cwd()
  const category = options.category ? normalizePath(options.category) : null

  // Single filesystem scan: buildTree returns tree + flat lists
  const result = buildTree(workspaceRoot, category)

  if (!result.success) {
    return result
  }

  // Format tree as string for display
  const treeDisplay = formatTreeAsString(result.data.tree)

  return {
    success: true,
    data: {
      features: result.data.features,
      categories: result.data.categories,
      total: result.data.total,
      filter: category || null,
      tree: result.data.tree,
      treeDisplay
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)

  const options = {}

  // Parse arguments
  if (args.length > 0 && !args[0].startsWith('--')) {
    options.category = args[0]
  }

  const result = listFeatures(options)
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

module.exports = { listFeatures }
