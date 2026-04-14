#!/usr/bin/env node
/**
 * Feature discovery utilities
 * Handles scanning specs/ directory and identifying features vs categories
 */

const fs = require('fs')
const path = require('path')

// Files that indicate a directory is a feature
const FEATURE_FILES = ['analyze.md','requirements.md', 'design.md', 'tasks.md']

/**
 * Checks if a directory is a feature (contains at least one feature file)
 * @param {string} dirPath - Full path to directory
 * @returns {boolean}
 */
function isFeature (dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false
  }

  const stat = fs.statSync(dirPath)
  if (!stat.isDirectory()) {
    return false
  }

  return FEATURE_FILES.some(file =>
    fs.existsSync(path.join(dirPath, file))
  )
}

/**
 * Checks if a directory is a category (exists, has subdirectories, not a feature)
 * @param {string} dirPath - Full path to directory
 * @returns {boolean}
 */
function isCategory (dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false
  }

  const stat = fs.statSync(dirPath)
  if (!stat.isDirectory()) {
    return false
  }

  // If it's a feature, it's not a category
  if (isFeature(dirPath)) {
    return false
  }

  // Check if it has subdirectories
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  return entries.some(entry => entry.isDirectory())
}

/**
 * Gets which feature files exist in a directory
 * @param {string} dirPath - Full path to directory
 * @returns {string[]} Array of existing feature file names
 */
function getFeatureFiles (dirPath) {
  if (!fs.existsSync(dirPath)) {
    return []
  }

  return FEATURE_FILES.filter(file =>
    fs.existsSync(path.join(dirPath, file))
  )
}

/**
 * Recursively discovers all features and categories under specs/
 * @param {string} [workspaceRoot] - Workspace root (defaults to process.cwd())
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function discoverFeatures (workspaceRoot = process.cwd()) {
  const specsDir = path.join(workspaceRoot, 'specs')

  if (!fs.existsSync(specsDir)) {
    return {
      success: false,
      error: 'specs/ directory not found',
      code: 'MISSING_DIRECTORIES'
    }
  }

  const features = []
  const categories = []

  function scanDirectory (currentPath, relativePath = '') {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      // Skip hidden directories
      if (entry.name.startsWith('.')) continue

      const fullPath = path.join(currentPath, entry.name)
      const entryRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name

      if (isFeature(fullPath)) {
        features.push({
          path: entryRelativePath,
          name: entry.name,
          files: getFeatureFiles(fullPath),
          fullPath
        })
      } else if (isCategory(fullPath)) {
        categories.push({
          path: entryRelativePath,
          name: entry.name,
          fullPath
        })
        // Recursively scan category
        scanDirectory(fullPath, entryRelativePath)
      } else {
        // Empty directory - treat as category but still scan
        scanDirectory(fullPath, entryRelativePath)
      }
    }
  }

  scanDirectory(specsDir)

  return {
    success: true,
    data: {
      features,
      categories,
      total: features.length
    }
  }
}

/**
 * Finds a feature by path
 * @param {string} featurePath - Feature path to find
 * @param {string} [workspaceRoot] - Workspace root
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function findFeature (featurePath, workspaceRoot = process.cwd()) {
  const fullPath = path.join(workspaceRoot, 'specs', featurePath)

  if (!fs.existsSync(fullPath)) {
    return {
      success: false,
      error: `Feature not found: ${featurePath}`,
      code: 'FEATURE_NOT_FOUND'
    }
  }

  if (!isFeature(fullPath)) {
    return {
      success: false,
      error: `Path is a category, not a feature: ${featurePath}`,
      code: 'PATH_IS_CATEGORY'
    }
  }

  return {
    success: true,
    data: {
      path: featurePath,
      name: path.basename(featurePath),
      files: getFeatureFiles(fullPath),
      fullPath
    }
  }
}

/**
 * Lists features within a specific category
 * @param {string} categoryPath - Category path to filter by
 * @param {string} [workspaceRoot] - Workspace root
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function listByCategory (categoryPath, workspaceRoot = process.cwd()) {
  const fullPath = path.join(workspaceRoot, 'specs', categoryPath)

  if (!fs.existsSync(fullPath)) {
    return {
      success: false,
      error: `Category not found: ${categoryPath}`,
      code: 'CATEGORY_NOT_FOUND'
    }
  }

  const result = discoverFeatures(workspaceRoot)
  if (!result.success) {
    return result
  }

  // Filter features that start with the category path
  const filteredFeatures = result.data.features.filter(f =>
    f.path.startsWith(categoryPath + '/') || f.path === categoryPath
  )

  const filteredCategories = result.data.categories.filter(c =>
    c.path.startsWith(categoryPath + '/') || c.path === categoryPath
  )

  return {
    success: true,
    data: {
      category: categoryPath,
      features: filteredFeatures,
      categories: filteredCategories,
      total: filteredFeatures.length
    }
  }
}

/**
 * Builds a tree structure for display AND collects flat feature/category lists
 * in a single filesystem scan.
 * @param {string} [workspaceRoot] - Workspace root
 * @param {string} [filterCategory] - Optional category to filter by
 * @returns {{success: boolean, data?: object, error?: string, code?: string}}
 */
function buildTree (workspaceRoot = process.cwd(), filterCategory = null) {
  const specsDir = path.join(workspaceRoot, 'specs')

  if (!fs.existsSync(specsDir)) {
    return {
      success: false,
      error: 'specs/ directory not found',
      code: 'MISSING_DIRECTORIES'
    }
  }

  const startDir = filterCategory
    ? path.join(specsDir, filterCategory)
    : specsDir

  if (!fs.existsSync(startDir)) {
    return {
      success: false,
      error: `Category not found: ${filterCategory}`,
      code: 'CATEGORY_NOT_FOUND'
    }
  }

  // Collect features and categories during tree traversal (single scan)
  const features = []
  const categories = []

  function buildNode (dirPath, relativePath = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const isFeatureDir = isFeature(dirPath)
    const node = {
      name: path.basename(dirPath),
      path: relativePath,
      type: isFeatureDir ? 'feature' : 'category',
      children: [],
      files: []
    }

    // Add feature files if this is a feature
    if (isFeatureDir) {
      node.files = getFeatureFiles(dirPath)
      // Also collect into flat list
      if (relativePath) {
        features.push({
          path: relativePath,
          name: path.basename(relativePath),
          files: node.files,
          fullPath: dirPath
        })
      }
    } else if (relativePath && isCategory(dirPath)) {
      // Collect category into flat list
      categories.push({
        path: relativePath,
        name: path.basename(relativePath),
        fullPath: dirPath
      })
    }

    // Add child directories
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue

      const childPath = path.join(dirPath, entry.name)
      const childRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name

      node.children.push(buildNode(childPath, childRelativePath))
    }

    return node
  }

  const tree = buildNode(startDir, filterCategory || '')
  tree.name = filterCategory || 'specs'

  return {
    success: true,
    data: {
      tree,
      features,
      categories,
      total: features.length
    }
  }
}

/**
 * Formats tree structure as ASCII tree string
 * @param {object} tree - Tree node from buildTree
 * @param {string} [prefix] - Prefix for current line
 * @param {boolean} [isRoot] - Whether this is the root node
 * @returns {string}
 */
function formatTreeAsString (tree, prefix = '', isRoot = true) {
  const lines = []

  // Handle root node differently
  if (isRoot) {
    lines.push(`${tree.name}/`)
    if (tree.children.length === 0 && tree.files.length === 0) {
      lines.push('  (empty)')
      return lines.join('\n')
    }
  }

  const children = tree.children || []
  const files = tree.files || []

  // Process children (directories)
  children.forEach((child, index) => {
    const isLastChild = index === children.length - 1 && files.length === 0
    const connector = isLastChild ? '└── ' : '├── '
    const suffix = '/'

    lines.push(`${prefix}${connector}${child.name}${suffix}`)

    // Recursively format child
    const childPrefix = prefix + (isLastChild ? '    ' : '│   ')
    const childLines = formatTreeAsString(child, childPrefix, false)
    if (childLines) {
      lines.push(childLines)
    }
  })

  // Process files (for features, only show when not root)
  if (!isRoot && files.length > 0) {
    files.forEach((file, index) => {
      const isLastFile = index === files.length - 1
      const connector = isLastFile ? '└── ' : '├── '
      lines.push(`${prefix}${connector}${file}`)
    })
  }

  return lines.filter(l => l).join('\n')
}

module.exports = {
  FEATURE_FILES,
  isFeature,
  isCategory,
  getFeatureFiles,
  discoverFeatures,
  findFeature,
  listByCategory,
  buildTree,
  formatTreeAsString
}
