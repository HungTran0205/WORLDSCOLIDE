#!/usr/bin/env node
/**
 * Switch feature script
 * Switches to an existing feature by updating active-feature.json
 */

const { validatePath, normalizePath, toBreadcrumb, getFeatureName } = require('./utils/paths')
const { writeState } = require('./utils/state')
const { findFeature } = require('./utils/discovery')

/**
 * Switches to an existing feature
 * @param {string} featurePath - Path to the feature to switch to
 * @param {object} [options] - Options
 * @param {string} [options.workspaceRoot] - Workspace root directory
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function switchFeature (featurePath, options = {}) {
  const workspaceRoot = options.workspaceRoot || process.cwd()

  // Validate path format
  const validation = validatePath(featurePath)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      code: 'INVALID_PATH'
    }
  }

  const normalizedPath = normalizePath(featurePath)

  // Check if feature exists
  const featureResult = findFeature(normalizedPath, workspaceRoot)
  if (!featureResult.success) {
    return featureResult
  }

  // Update active feature state
  const stateResult = writeState(normalizedPath, workspaceRoot)
  if (!stateResult.success) {
    return stateResult
  }

  return {
    success: true,
    data: {
      feature: normalizedPath,
      name: getFeatureName(normalizedPath),
      breadcrumb: toBreadcrumb(normalizedPath),
      files: featureResult.data.files,
      fullPath: featureResult.data.fullPath,
      lastModified: stateResult.data.lastModified
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(JSON.stringify({
      success: false,
      error: 'Usage: switch.js <feature-path>',
      code: 'MISSING_ARGS'
    }, null, 2))
    process.exit(1)
  }

  const result = switchFeature(args[0])
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

module.exports = { switchFeature }
