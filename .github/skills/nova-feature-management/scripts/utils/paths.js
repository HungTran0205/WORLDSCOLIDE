#!/usr/bin/env node
/**
 * Path validation utilities for feature management
 * Handles path validation, normalization, and breadcrumb generation
 */

const path = require('path')

// Valid path segment pattern: lowercase letters, numbers, hyphens, underscores
// Must start with a letter
const VALID_SEGMENT = /^[a-z][a-z0-9_-]*$/

/**
 * Validates a single path segment
 * @param {string} segment - Path segment to validate
 * @returns {{valid: boolean, error?: string}}
 */
function validateSegment (segment) {
  if (!segment || segment.length === 0) {
    return { valid: false, error: 'Segment cannot be empty' }
  }

  if (segment.length > 64) {
    return { valid: false, error: `Segment too long: ${segment} (max 64 chars)` }
  }

  if (!VALID_SEGMENT.test(segment)) {
    return {
      valid: false,
      error: `Invalid segment: "${segment}". Must start with lowercase letter, contain only lowercase letters, numbers, hyphens, and underscores`
    }
  }

  return { valid: true }
}

/**
 * Validates a full feature path
 * @param {string} featurePath - Feature path to validate (e.g., "auth/login")
 * @returns {{valid: boolean, error?: string, segments?: string[]}}
 */
function validatePath (featurePath) {
  if (!featurePath || typeof featurePath !== 'string') {
    return { valid: false, error: 'Path is required and must be a string' }
  }

  // Normalize path separators to forward slash
  const normalizedPath = featurePath.replace(/\\/g, '/')

  // Remove leading/trailing slashes
  const cleanPath = normalizedPath.replace(/^\/+|\/+$/g, '')

  if (cleanPath.length === 0) {
    return { valid: false, error: 'Path cannot be empty' }
  }

  // Split into segments
  const segments = cleanPath.split('/')

  // Validate each segment
  for (const segment of segments) {
    const result = validateSegment(segment)
    if (!result.valid) {
      return result
    }
  }

  // Check total path length
  if (cleanPath.length > 256) {
    return { valid: false, error: 'Path too long (max 256 chars)' }
  }

  return { valid: true, segments }
}

/**
 * Normalizes a feature path (ensures forward slashes, removes extra slashes)
 * @param {string} featurePath - Path to normalize
 * @returns {string} Normalized path
 */
function normalizePath (featurePath) {
  if (!featurePath) return ''
  return featurePath
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '')
}

/**
 * Converts a feature path to breadcrumb format
 * @param {string} featurePath - Feature path (e.g., "auth/login")
 * @returns {string} Breadcrumb (e.g., "auth > login")
 */
function toBreadcrumb (featurePath) {
  const normalized = normalizePath(featurePath)
  if (!normalized) return ''
  return normalized.split('/').join(' > ')
}

/**
 * Gets the feature name (last segment) from a path
 * @param {string} featurePath - Feature path
 * @returns {string} Feature name
 */
function getFeatureName (featurePath) {
  const normalized = normalizePath(featurePath)
  if (!normalized) return ''
  const segments = normalized.split('/')
  return segments[segments.length - 1]
}

/**
 * Gets the full filesystem path for a feature
 * @param {string} featurePath - Feature path (e.g., "auth/login")
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {string} Full filesystem path
 */
function getFullPath (featurePath, workspaceRoot = process.cwd()) {
  const normalized = normalizePath(featurePath)
  return path.join(workspaceRoot, 'specs', normalized)
}

/**
 * Gets the parent category path (all segments except the last)
 * @param {string} featurePath - Feature path
 * @returns {string|null} Parent path or null if root level
 */
function getParentPath (featurePath) {
  const normalized = normalizePath(featurePath)
  if (!normalized) return null

  const segments = normalized.split('/')
  if (segments.length <= 1) return null

  return segments.slice(0, -1).join('/')
}

/**
 * Checks if a path is a root-level feature (no category)
 * @param {string} featurePath - Feature path
 * @returns {boolean}
 */
function isRootLevel (featurePath) {
  const normalized = normalizePath(featurePath)
  return !normalized.includes('/')
}

module.exports = {
  VALID_SEGMENT,
  validateSegment,
  validatePath,
  normalizePath,
  toBreadcrumb,
  getFeatureName,
  getFullPath,
  getParentPath,
  isRootLevel
}
