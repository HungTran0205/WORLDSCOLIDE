---
name: tm:plsql
metadata: version: 1.00
description: This skill should be used when writing PL/SQL code or SQL query that adheres to CIS HU TM Server standards, generating packages/procedures/types/triggers, or querying Oracle databases via pre-configured SQLcl connections. Integrates code generation templates with database operations.
---

# PL/SQL Development Skill

## Purpose

Generate production-ready PL/SQL code following CIS HU TM Server code standards, execute queries against Oracle databases, and manage database objects (packages, procedures, types, triggers) with audit logging, error handling, and validation patterns pre-injected.

## When to Use

- Generating new PL/SQL packages/procedures that must follow naming conventions and error handling standards
- Writing database queries against pre-configured Oracle connections
- Creating custom types, views, or triggers with auto-formatted compliance
- Migrating or refactoring existing PL/SQL code to current standards
- Retrieving schema metadata or querying data from connected databases
- Implementing patterns: batch processing, rate limiting, allocation, audit trails
- Creating data patches for reference data (properties, domains, system properties, third-party configs)

## How to Use This Skill

### 1. Connection Management

Before executing any database operation, establish connection via `list-connections` then `connect`:

```
1. Use mcp_sqlcl_-_sql_d_list_connections to view available databases
2. Call mcp_sqlcl_-_sql_d_connect with connection name to activate
3. Execute queries/scripts
4. Call mcp_sqlcl_-_sql_d_disconnect when done
```

**References**: [Connection Setup](references/connection-setup.md)

### 2. Code Generation & Standards

Generate code that automatically complies with naming, error handling, and audit patterns:

- **Naming Conventions**: Review [naming-conventions.md](references/naming-conventions.md) for package (`pkg_*`), procedure (`create_/update_/get_`), variable (`i/o/l/c/g{name}`) prefixes
- **Error Handling**: Use error code ranges (-20000 to -20999); see [error-handling.md](references/error-handling.md) for templates
- **Package Patterns**: Reference [package-patterns.md](references/package-patterns.md) for batch processing, rate limiting, allocation, audit logging patterns
- **Type Definitions**: See [type-definitions.md](references/type-definitions.md) for object types and collection structures
- **Trigger Standards**: Use [trigger-patterns.md](references/trigger-patterns.md) for AIUR pattern with audit trail
- **Data Patches**: Use [data-patches.md](references/data-patches.md) for creating reference data patches (properties, domains, system configs)

### 3. Workflow

**Generate new package**:
```
1. Define domain, package name, procedures needed
2. Reference naming conventions + error handling patterns
3. Write code using templates as scaffolding
4. Format using standards (audit logging, comments, validation)
5. Execute queries to retrieve metadata if needed
6. Test via connection before commit
```

**Query database**:
```
1. Connect to target database
2. Use mcp_sqlcl_-_sql_d_schema-information to inspect schema
3. Execute queries with mcp_sqlcl_-_sql_d_run-sql
4. Results returned as CSV format
```

**Create data patch**:
```
1. Generate patch filename: pdm{YYMMDD}{initials}{sequence}.sql
2. Use standard patch template with header and audit logging
3. Add reference data changes (properties, domains, system configs)
4. Include existence checks (WHERE NOT EXISTS) to prevent duplicates
5. Log all operations with row counts
6. Test on development database before deployment
```

### 4. Code Quality Checklist

- [ ] Naming follows `pkg_{domain}_{function}`, `PROCEDURE {verb}_{entity}`, variable prefixes
- [ ] Error handling with custom exceptions (-20XXX range)
- [ ] Audit logging via `pkg_audit.log_change()` or `pkg_audit.setInfo()`
- [ ] Input validation on all parameters
- [ ] Comments for complex logic (multilingual where applicable)
- [ ] Batch processing uses SAVEPOINT for transaction control
- [ ] Types defined with proper documentation
- [ ] Views marked READ ONLY when appropriate
- [ ] Triggers follow AIUR pattern with audit trail
- [ ] Data patches use `WHERE NOT EXISTS` to prevent duplicates
- [ ] Data patches follow naming convention `pdm{YYMMDD}{initials}{seq}.sql`
- [ ] All DML operations log row counts

## Related Skills

- [tm:sql-query](../sql-query/SKILL.md) - Connection management, basic SQL execution
- [tm:technical-analysis](../technical-analysis/SKILL.md) - Code review and architecture analysis

## References

All references are organized for progressive disclosure:

- **Connection Setup** → [connection-setup.md](references/connection-setup.md)
- **Naming Standards** → [naming-conventions.md](references/naming-conventions.md)
- **Error Handling** → [error-handling.md](references/error-handling.md)
- **Package Patterns** → [package-patterns.md](references/package-patterns.md)
- **Type Definitions** → [type-definitions.md](references/type-definitions.md)
- **Trigger Patterns** → [trigger-patterns.md](references/trigger-patterns.md)
- **Data Patches** → [data-patches.md](references/data-patches.md)

**Code Examples** → [query-examples.md](references/query-examples.md)

---

**Last Updated**: January 22, 2026  
**Maintained By**: Development Team  
**Base Standards**: docs/cis-hu-tm-server/code-standards.md
