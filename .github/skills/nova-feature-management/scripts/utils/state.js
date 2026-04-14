#!/usr/bin/env node
/**
 * State management utilities for feature management
 * Handles reading and writing active-feature.json
 */

const fs = require('fs')
const path = require('path')

const STATE_FILE = '.nova/context/active-feature.json'

/**
 * Gets the full path to the state file
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {string} Full path to state file
 */
function getStatePath (workspaceRoot = process.cwd()) {
  return path.join(workspaceRoot, STATE_FILE)
}

/**
 * Reads the current active feature state
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function readState (workspaceRoot = process.cwd()) {
  const statePath = getStatePath(workspaceRoot)

  try {
    // Check if context directory exists
    const contextDir = path.dirname(statePath)
    if (!fs.existsSync(contextDir)) {
      return {
        success: true,
        data: {
          activeFeature: null,
          lastModified: null
        }
      }
    }

    // Check if state file exists
    if (!fs.existsSync(statePath)) {
      return {
        success: true,
        data: {
          activeFeature: null,
          lastModified: null
        }
      }
    }

    // Read and parse state file
    const content = fs.readFileSync(statePath, 'utf8')

    // Handle empty file
    if (!content.trim()) {
      return {
        success: true,
        data: {
          activeFeature: null,
          lastModified: null
        }
      }
    }

    const state = JSON.parse(content)

    return {
      success: true,
      data: {
        activeFeature: state.activeFeature || null,
        lastModified: state.lastModified || null
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        success: true,
        data: {
          activeFeature: null,
          lastModified: null
        }
      }
    }

    return {
      success: false,
      error: `Failed to read state: ${error.message}`,
      code: 'STATE_READ_ERROR'
    }
  }
}

/**
 * Writes the active feature state
 * @param {string} activeFeature - Feature path to set as active (or null to clear)
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function writeState (activeFeature, workspaceRoot = process.cwd()) {
  const statePath = getStatePath(workspaceRoot)

  try {
    // Ensure context directory exists
    const contextDir = path.dirname(statePath)
    if (!fs.existsSync(contextDir)) {
      fs.mkdirSync(contextDir, { recursive: true })
    }

    const state = {
      activeFeature: activeFeature || null,
      lastModified: new Date().toISOString()
    }

    // Atomic write: write to temp file then rename
    const tempPath = `${statePath}.tmp`
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8')
    fs.renameSync(tempPath, statePath)

    return {
      success: true,
      data: state
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to write state: ${error.message}`,
      code: 'STATE_WRITE_ERROR'
    }
  }
}

/**
 * Clears the active feature state
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function clearState (workspaceRoot = process.cwd()) {
  return writeState(null, workspaceRoot)
}

/**
 * Checks if there's an active feature
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {boolean}
 */
function hasActiveFeature (workspaceRoot = process.cwd()) {
  const result = readState(workspaceRoot)
  return result.success && result.data.activeFeature !== null
}

/**
 * Gets the current active feature path
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {string|null}
 */
function getActiveFeature (workspaceRoot = process.cwd()) {
  const result = readState(workspaceRoot)
  if (result.success && result.data.activeFeature) {
    return result.data.activeFeature
  }
  return null
}

module.exports = {
  STATE_FILE,
  getStatePath,
  readState,
  writeState,
  clearState,
  hasActiveFeature,
  getActiveFeature
}
