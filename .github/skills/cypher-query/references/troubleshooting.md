# Troubleshooting Guide

Quick solutions for common Cypher query issues.

---

## Query Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Write operation 'CREATE' not allowed` | Using write ops | Remove CREATE/MERGE/DELETE/SET - read-only mode |
| `Query must contain MATCH` | Missing MATCH | All queries need `MATCH` or `CALL` |
| `Query must contain RETURN` | No output | Add `RETURN` clause |
| `Query timeout after 30s` | Query too expensive | Add LIMIT, bound paths `*1..3` |
| `Unknown label 'Functions'` | Wrong label name | Use singular: `Function`, `Method`, `Class` |
| `Property 'full_name' does not exist` | Wrong property | Use `qualified_name`, not `full_name` |

---

## Connection Issues

**Cannot connect to Memgraph:**
```bash
# Check if running
docker ps | grep memgraph

# Start if needed
cd code-graph-rag && docker-compose up -d memgraph

# Verify connection
python -c "from codebase_rag.services.graph import GraphService; GraphService()"
```

**Empty results / No data:**
```cypher
-- Check data exists
MATCH (n) RETURN count(n) AS total

-- List projects
MATCH (p:Project) RETURN p.name
```

**Ingest data if needed:**
```bash
cd code-graph-rag
python -m codebase_rag.cli ingest --project my-project --path /path/to/code
```

---

## Performance Issues

**Query too slow:**
1. Add specific labels: `MATCH (c:Class)` not `MATCH (n)`
2. Filter in MATCH: `MATCH (c:Class {name: 'X'})` 
3. Always add `LIMIT`
4. Bound paths: `[:CALLS*1..3]`

**Results too large / truncated:**
```cypher
-- Select only needed properties
RETURN n.name, n.qualified_name  -- not RETURN n

-- Use pagination
SKIP 0 LIMIT 100  -- page 1
SKIP 100 LIMIT 100  -- page 2
```

---

## Script Issues

**ModuleNotFoundError: codebase_rag:**
```bash
cd code-graph-rag
pip install -e .
python -m codebase_rag.cli --help
```

**Permission denied:**
```bash
python .github/skills/cypher-query/scripts/query.py "your query"
```

---

## Data Issues

**Stale data after code changes:**
```bash
# Re-ingest
cd code-graph-rag
python -m codebase_rag.cli ingest --project my-project --path /path/to/code

# Or delete and re-ingest
python -m codebase_rag.cli delete-project --name my-project
python -m codebase_rag.cli ingest --project my-project --path /path/to/code
```

---

## Debug Tips

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

```bash
# Check Memgraph logs
docker logs <memgraph-container>

# Interactive query (if Memgraph Lab available)
# http://localhost:3000
```

---

*Updated: 2026-01-20*
