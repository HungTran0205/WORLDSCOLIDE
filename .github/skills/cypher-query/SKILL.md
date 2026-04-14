---
name: tm:cypher-query
metadata: version: 1.00
description: Query code knowledge graph with natural language or Cypher. Use for code navigation, dependency analysis, impact analysis, call graph exploration.
---

# Cypher Query Skill

Query Memgraph code knowledge graph via natural language or direct Cypher for advanced code exploration and analysis.

## When to Use

Use this skill when you need to:

- **Find all callers/callees** of a function or method
- **Trace dependencies** between modules, packages, or classes
- **Analyze code impact radius** - what gets affected by a change
- **Navigate class hierarchies** - inheritance trees, implementations
- **Find cross-language calls** (prepared for Java → PLSQL in Phase 2)
- **Search by decorator** - find all `@task`, `@flow` decorated functions
- **Locate specific files** - by name, path pattern, or extension
- **Explore module structure** - packages, imports, exports

## Quick Start

### Natural Language Query

```bash
python ../.github/skills/cypher-query/scripts/query.py "Find all functions that call sendEmail"
```

### Direct Cypher Query

```bash
python ../.github/skills/cypher-query/scripts/query.py --cypher "MATCH (m:METHOD)-[:CALLS]->(t:METHOD {name:'sendEmail'}) RETURN m.qualified_name"
```

### Output Formats

```bash
# JSON output (default)
python query.py "Show all Python files" --format json

# Markdown table
python query.py "List all classes" --format markdown

# Plain table
python query.py "Find README files" --format table
```

## Graph Schema

**Quick Variable Names:**
`m`=Method `f`=Function `c`=Class `pkg`=Package `mod`=Module `file`=File `ext`=ExternalPackage `n`=Generic

**📚 References:**
- **[Reference](references/reference.md)** - Schema, patterns, tips (all-in-one)
- **[Troubleshooting](references/troubleshooting.md)** - Common errors & solutions

**Node Types:** Project, Package, Folder, File, Module, Class, Method, Function, ExternalPackage

**Key Relationships:** CALLS, IMPORTS, INHERITS, OVERRIDES, DEFINES, DEFINES_METHOD, DEPENDS_ON_EXTERNAL

**Example:**
```cypher
MATCH (m:Method {name: 'sendStt'}) RETURN m.qualified_name, m.start_line
MATCH (caller)-[:CALLS]->(m:Method {name: 'sendStt'}) RETURN caller.qualified_name
```

## Common Patterns

See [references/reference.md](references/reference.md) for detailed query examples.

**Popular Queries:**

```cypher
// Find all callers of a function
MATCH (caller:Function|Method)-[:CALLS]->(callee {name: 'target_func'})
RETURN caller.qualified_name, callee.qualified_name

// Class inheritance tree
MATCH path = (c:Class)-[:INHERITS*]->(base:Class)
WHERE c.name = 'MyClass'
RETURN path

// Files by extension
MATCH (f:File {extension: '.py'})
RETURN f.path, f.name
LIMIT 100
```

## Safety & Limitations

- **Read-only mode** enforced by default (CREATE, DELETE, MERGE blocked)
- **Query timeout:** 30 seconds
- **Result limit:** Auto-injected LIMIT 1000 if not specified
- **Token optimization:** Large results truncated for LLM consumption

## Troubleshooting

See [references/troubleshooting.md](references/troubleshooting.md) for common issues and solutions.

## Integration with Agents

When an agent activates this skill, it will:

1. Accept your natural language query
2. Use **graphCode MCP server** tools:
   - `query_codeflow` for natural language queries
   - `execute_cypher` for direct Cypher queries
3. MCP server handles validation (read-only enforcement)
4. MCP server executes against Memgraph database
5. Results returned for analysis

**Example workflow:**

```
User: "Show me all methods that override parent methods"
Agent: [Calls query_codeflow MCP tool] → [Receives results] → [Analyzes]
```

## Architecture

```
User Query (Natural Language)
        │
        v
┌─────────────────────────┐
│   SKILL.md (patterns)   │  ← This skill
└───────────┬─────────────┘
            v
┌─────────────────────────┐
│  graphCode MCP Server   │
│                         │
│  • query_codeflow       │  ← Natural language
│  • execute_cypher       │  ← Direct Cypher
└───────────┬─────────────┘
            v
┌─────────────────────────┐
│   Memgraph Database     │
│  (Code Knowledge Graph) │
└───────────┬─────────────┘
            v
┌─────────────────────────┐
│    Formatted Results    │
└─────────────────────────┘
```

## Requirements

- **graphCode MCP server** must be configured and running
- Access to Memgraph database with ingested code graph

## Version History

- **1.0.0** (2026-01-20): Initial release with read-only queries, validation, and natural language support
