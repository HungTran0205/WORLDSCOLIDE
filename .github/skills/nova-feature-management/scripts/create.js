#!/usr/bin/env node
/**
 * Create feature script
 * Creates a new feature with validated path, directory structure, and initial requirements.md
 */

const fs = require('fs')
const path = require('path')
const { validatePath, normalizePath, getFullPath, getFeatureName, toBreadcrumb } = require('./utils/paths')
const { writeState } = require('./utils/state')
const { isFeature } = require('./utils/discovery')

/**
 * Creates a new feature
 * @param {string} featurePath - Path for the new feature (e.g., "auth/login")
 * @param {object} [options] - Options
 * @param {string} [options.workspaceRoot] - Workspace root directory
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function createFeature (featurePath, options = {}) {
  const workspaceRoot = options.workspaceRoot || process.cwd()

  // Validate path
  const validation = validatePath(featurePath)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      code: 'INVALID_PATH'
    }
  }

  const normalizedPath = normalizePath(featurePath)
  const fullPath = getFullPath(normalizedPath, workspaceRoot)
  const featureName = getFeatureName(normalizedPath)

  // Check if specs directory exists
  const specsDir = path.join(workspaceRoot, 'specs')
  if (!fs.existsSync(specsDir)) {
    return {
      success: false,
      error: 'specs/ directory not found. Run `gh nova init` to bootstrap workspace.',
      code: 'MISSING_DIRECTORIES'
    }
  }

  // Check if feature already exists
  if (fs.existsSync(fullPath) && isFeature(fullPath)) {
    return {
      success: false,
      error: `Feature already exists: ${normalizedPath}. Use @feature switch to switch to it.`,
      code: 'FEATURE_EXISTS'
    }
  }

  try {
    // Create feature directory
    fs.mkdirSync(fullPath, { recursive: true })

    // Write minimal requirements.md with template reference
    const requirementsPath = path.join(fullPath, 'requirements.md')
    const requirementsContent = `# Requirements: ${featureName}\n\n<!-- Template: .nova/spec-templates/requirements-template.md -->\n`
    fs.writeFileSync(requirementsPath, requirementsContent, 'utf8')

    // Write minimal design.md with template reference
    const designPath = path.join(fullPath, 'design.md')
    const designContent = `# Design: ${featureName}\n\n<!-- Template: .nova/spec-templates/design-template.md -->\n`
    fs.writeFileSync(designPath, designContent, 'utf8')

    // Write minimal tasks.md with template reference
    const tasksPath = path.join(fullPath, 'tasks.md')
    const tasksContent = `# Tasks: ${featureName}\n\n<!-- Template: .nova/spec-templates/tasks-template.md -->\n`
    fs.writeFileSync(tasksPath, tasksContent, 'utf8')

    // Update active feature state
    const stateResult = writeState(normalizedPath, workspaceRoot)
    if (!stateResult.success) {
      // Feature was created but state update failed - log warning but don't fail
      console.error(`Warning: Feature created but state update failed: ${stateResult.error}`)
    }

    return {
      success: true,
      data: {
        feature: normalizedPath,
        name: featureName,
        breadcrumb: toBreadcrumb(normalizedPath),
        files: ['requirements.md', 'design.md', 'tasks.md'],
        fullPath,
        requirementsPath,
        designPath,
        tasksPath,
        lastModified: stateResult.data?.lastModified || new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to create feature: ${error.message}`,
      code: 'CREATE_ERROR'
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(JSON.stringify({
      success: false,
      error: 'Usage: create.js <feature-path>',
      code: 'MISSING_ARGS'
    }, null, 2))
    process.exit(1)
  }

  const result = createFeature(args[0])
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

module.exports = { createFeature }
