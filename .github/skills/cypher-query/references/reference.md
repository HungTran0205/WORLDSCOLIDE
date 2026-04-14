# Cypher Query Reference

Quick reference for querying Memgraph code knowledge graph.

---

## Variable Naming

```
p=Project  pkg=Package  mod=Module  f=File  folder=Folder
c=Class    m=Method     fn=Function ext=ExternalPackage  n=Generic
```

---

## Node Types & Properties

| Node | Key Properties |
|------|----------------|
| **Project** | `name` |
| **Package** | `qualified_name`, `name`, `path` |
| **Folder** | `path`, `name` |
| **File** | `path`, `name`, `extension` |
| **Module** | `qualified_name`, `name`, `path` |
| **Class** | `qualified_name`, `name`, `decorators[]`, `start_line`, `end_line`, `docstring`, `is_exported` |
| **Function** | `qualified_name`, `name`, `decorators[]`, `start_line`, `end_line`, `docstring`, `is_exported` |
| **Method** | `qualified_name`, `name`, `decorators[]`, `start_line`, `end_line`, `docstring` |
| **ExternalPackage** | `name` |

---

## Relationships

```
Structure:
  (Project|Package) -[:CONTAINS_PACKAGE]-> (Package)
  (Project|Folder)  -[:CONTAINS_FOLDER]->  (Folder)
  (Folder)          -[:CONTAINS_FILE]->    (File)
  (Package)         -[:CONTAINS_MODULE]->  (Module)

Definitions:
  (Module|File) -[:DEFINES]->        (Class|Function)
  (Class)       -[:DEFINES_METHOD]-> (Method)

Code Flow:
  (Function|Method) -[:CALLS]->     (Function|Method)
  (Module)          -[:IMPORTS]->   (Module|Class|Function)
  (Class)           -[:INHERITS]->  (Class)
  (Method)          -[:OVERRIDES]-> (Method)

Dependencies:
  (Module|Class|Function) -[:DEPENDS_ON_EXTERNAL]-> (ExternalPackage)
```

---

## Query Patterns

### Find Code Elements

```cypher
-- By name (exact)
MATCH (m:Method {name: 'sendStt'}) RETURN m.qualified_name, m.start_line

-- Pattern match
MATCH (m:Method) WHERE m.name CONTAINS 'send' RETURN m.qualified_name LIMIT 50

-- By decorator
MATCH (f:Function) WHERE '@task' IN f.decorators RETURN f.qualified_name LIMIT 50

-- Files by extension
MATCH (f:File {extension: '.py'}) RETURN f.path LIMIT 100
```

### Call Graph

```cypher
-- Direct callers (who calls this?)
MATCH (caller)-[:CALLS]->(m:Method {name: 'sendStt'})
RETURN caller.qualified_name

-- Indirect callers (up to 3 levels)
MATCH (caller)-[:CALLS*1..3]->(m:Method {name: 'sendStt'})
RETURN DISTINCT caller.qualified_name LIMIT 50

-- Direct callees (what does this call?)
MATCH (m:Method {name: 'sendStt'})-[:CALLS]->(callee)
RETURN callee.qualified_name
```

### Class Structure

```cypher
-- Class with methods
MATCH (c:Class {name: 'MyClass'})-[:DEFINES_METHOD]->(m:Method)
RETURN m.name, m.start_line ORDER BY m.start_line

-- Inheritance tree
MATCH path = (c:Class {name: 'MyClass'})-[:INHERITS*]->(base:Class)
RETURN path

-- All subclasses
MATCH (sub:Class)-[:INHERITS]->(parent:Class {name: 'BaseModel'})
RETURN sub.name, sub.qualified_name LIMIT 50

-- Overridden methods
MATCH (m:Method)-[:OVERRIDES]->(parent:Method)
RETURN m.qualified_name, parent.qualified_name LIMIT 50
```

### Dependencies

```cypher
-- External packages used
MATCH (n)-[:DEPENDS_ON_EXTERNAL]->(ext:ExternalPackage)
RETURN ext.name, count(n) AS usage ORDER BY usage DESC LIMIT 20

-- Module imports
MATCH (mod:Module)-[:IMPORTS]->(imported)
RETURN mod.name, imported.qualified_name LIMIT 100
```

### Impact Analysis

```cypher
-- What's affected if I change this function?
MATCH (target:Function {name: 'calculatePrice'})<-[:CALLS*1..3]-(affected)
RETURN DISTINCT affected.qualified_name LIMIT 100

-- What's affected if I change this base class?
MATCH (base:Class {name: 'BaseModel'})<-[:INHERITS*]-(derived:Class)
RETURN derived.qualified_name LIMIT 100
```

---

## Useful Filters

```cypher
WHERE m.docstring IS NOT NULL            -- Has docstring
WHERE '@task' IN m.decorators            -- Has decorator
WHERE m.start_line >= 100                -- Line range
WHERE m.name =~ '(?i).*send.*'           -- Regex (case-insensitive)
WHERE 'Method' IN labels(n)              -- Check label
```

---

## Performance Tips

1. **Filter early** with node properties in MATCH:
   ```cypher
   -- ✓ Good
   MATCH (c:Class {name: 'MyClass'})-[:DEFINES_METHOD]->(m)
   -- ✗ Slow
   MATCH (c:Class)-[:DEFINES_METHOD]->(m) WHERE c.name = 'MyClass'
   ```

2. **Always add LIMIT**:
   ```cypher
   MATCH (n) RETURN n LIMIT 100
   ```

3. **Bound path traversals**:
   ```cypher
   -- ✓ Good: limited depth
   MATCH path = (a)-[:CALLS*1..3]->(b)
   -- ✗ Bad: unbounded (can explode!)
   MATCH path = (a)-[:CALLS*]->(b)
   ```

4. **Use DISTINCT** for unique results:
   ```cypher
   RETURN DISTINCT caller.qualified_name
   ```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `MATCH (m:METHOD)` | Labels are case-sensitive: `MATCH (m:Method)` |
| `MATCH (n:Functions)` | Use singular: `MATCH (n:Function)` |
| `WHERE n.full_name = ...` | Correct property: `WHERE n.qualified_name = ...` |
| Missing LIMIT | Always add `LIMIT 100` or appropriate value |
| Unbounded paths `[:CALLS*]` | Use bounded `[:CALLS*1..3]` |

---

*Updated: 2026-01-20*
