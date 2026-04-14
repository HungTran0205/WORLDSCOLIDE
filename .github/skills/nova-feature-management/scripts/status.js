#!/usr/bin/env node
/**
 * Status script
 * Returns current feature context from active-feature.json
 */

const { readState } = require('./utils/state')
const { findFeature } = require('./utils/discovery')
const { toBreadcrumb, getFeatureName } = require('./utils/paths')

/**
 * Gets the current feature status
 * @param {object} [options] - Options
 * @param {string} [options.workspaceRoot] - Workspace root directory
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function getStatus (options = {}) {
  const workspaceRoot = options.workspaceRoot || process.cwd()

  // Read current state
  const stateResult = readState(workspaceRoot)
  if (!stateResult.success) {
    return stateResult
  }

  const { activeFeature, lastModified } = stateResult.data

  // No active feature
  if (!activeFeature) {
    return {
      success: true,
      data: {
        hasActiveFeature: false,
        activeFeature: null,
        name: null,
        breadcrumb: null,
        files: null,
        fullPath: null,
        lastModified: null
      }
    }
  }

  // Verify feature still exists
  const featureResult = findFeature(activeFeature, workspaceRoot)
  if (!featureResult.success) {
    // Feature was deleted or moved - state is stale
    return {
      success: true,
      data: {
        hasActiveFeature: false,
        activeFeature,
        stale: true,
        staleReason: featureResult.error,
        name: null,
        breadcrumb: null,
        files: null,
        fullPath: null,
        lastModified
      }
    }
  }

  return {
    success: true,
    data: {
      hasActiveFeature: true,
      activeFeature,
      name: getFeatureName(activeFeature),
      breadcrumb: toBreadcrumb(activeFeature),
      files: featureResult.data.files,
      fullPath: featureResult.data.fullPath,
      lastModified
    }
  }
}

// CLI execution
if (require.main === module) {
  const result = getStatus()
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

module.exports = { getStatus }
