#!/usr/bin/env python3
"""Cypher query validation for read-only safety.

This module provides validation functions to ensure Cypher queries
are safe for execution in read-only mode.
"""

from typing import Tuple

# Keywords that modify the graph (forbidden in read-only mode)
FORBIDDEN_KEYWORDS = [
    'CREATE',
    'MERGE',
    'DELETE',
    'DETACH DELETE',
    'SET',
    'REMOVE',
    'DROP',
]

# Keywords that must be present for valid read queries
REQUIRED_KEYWORDS_READ = ['MATCH', 'CALL']
REQUIRED_KEYWORDS_OUTPUT = ['RETURN', 'YIELD']


def validate_cypher(query: str, allow_write: bool = False) -> Tuple[bool, str]:
    """Validate Cypher query for safety.

    Args:
        query: Cypher query string to validate
        allow_write: If False, blocks write operations (default: False)

    Returns:
        Tuple of (is_valid, error_message)
        - is_valid: True if query passes validation
        - error_message: Empty string if valid, error description if invalid

    Examples:
        >>> validate_cypher("MATCH (n) RETURN n LIMIT 10")
        (True, "")

        >>> validate_cypher("CREATE (n:Node) RETURN n")
        (False, "Write operation 'CREATE' not allowed in read-only mode")

        >>> validate_cypher("MATCH (n)")
        (False, "Query must contain RETURN or YIELD clause")
    """
    if not query or not query.strip():
        return False, "Query cannot be empty"

    # Normalize query for keyword checking
    upper_query = query.upper()
    normalized = ' '.join(upper_query.split())  # Normalize whitespace

    # Check for forbidden write operations
    if not allow_write:
        for keyword in FORBIDDEN_KEYWORDS:
            if keyword in normalized:
                return False, f"Write operation '{keyword}' not allowed in read-only mode"

    # Check for required read clause (MATCH or CALL)
    has_read_clause = any(kw in normalized for kw in REQUIRED_KEYWORDS_READ)
    if not has_read_clause:
        return False, f"Query must contain {' or '.join(REQUIRED_KEYWORDS_READ)} clause"

    # Check for required output clause (RETURN or YIELD)
    has_output_clause = any(kw in normalized for kw in REQUIRED_KEYWORDS_OUTPUT)
    if not has_output_clause:
        return False, f"Query must contain {' or '.join(REQUIRED_KEYWORDS_OUTPUT)} clause"

    return True, ""


def inject_limit(query: str, limit: int = 1000) -> str:
    """Add LIMIT clause if not present to prevent overwhelming results.

    Args:
        query: Cypher query string
        limit: Maximum number of results (default: 1000)

    Returns:
        Query with LIMIT clause added if not already present

    Examples:
        >>> inject_limit("MATCH (n) RETURN n")
        'MATCH (n) RETURN n LIMIT 1000'

        >>> inject_limit("MATCH (n) RETURN n LIMIT 50")
        'MATCH (n) RETURN n LIMIT 50'

        >>> inject_limit("MATCH (n) RETURN n;", limit=100)
        'MATCH (n) RETURN n LIMIT 100;'
    """
    if not query:
        return query

    # Check if LIMIT already exists (case-insensitive)
    if 'LIMIT' in query.upper():
        return query

    # Strip trailing semicolon and whitespace
    cleaned = query.rstrip(';').rstrip()

    # Check if query ends with semicolon
    has_semicolon = query.rstrip().endswith(';')

    # Add LIMIT
    if has_semicolon:
        return f"{cleaned} LIMIT {limit};"
    else:
        return f"{cleaned} LIMIT {limit}"


def sanitize_query(query: str) -> str:
    """Clean and normalize Cypher query string.

    Args:
        query: Raw query string (may include markdown code blocks)

    Returns:
        Cleaned query string

    Examples:
        >>> sanitize_query("```cypher\\nMATCH (n) RETURN n\\n```")
        'MATCH (n) RETURN n'

        >>> sanitize_query("  MATCH (n) RETURN n  ")
        'MATCH (n) RETURN n'
    """
    if not query:
        return ""

    # Remove markdown code block markers
    cleaned = query.strip()

    # Remove ```cypher or ``` markers
    if cleaned.startswith('```'):
        lines = cleaned.split('\n')
        # Remove first line if it's ```cypher or ```
        if lines[0].strip() in ('```cypher', '```'):
            lines = lines[1:]
        # Remove last line if it's ```
        if lines and lines[-1].strip() == '```':
            lines = lines[:-1]
        cleaned = '\n'.join(lines)

    # Remove "cypher" prefix if present
    if cleaned.strip().lower().startswith('cypher'):
        cleaned = cleaned.strip()[6:].strip()

    return cleaned.strip()


def validate_and_prepare(
    query: str,
    allow_write: bool = False,
    auto_limit: bool = True,
    limit: int = 1000
) -> Tuple[bool, str, str]:
    """Validate and prepare query for execution.

    This is the main entry point that combines sanitization,
    validation, and limit injection.

    Args:
        query: Raw query string
        allow_write: Allow write operations (default: False)
        auto_limit: Auto-inject LIMIT if not present (default: True)
        limit: Default limit value (default: 1000)

    Returns:
        Tuple of (is_valid, prepared_query, error_message)

    Examples:
        >>> validate_and_prepare("MATCH (n) RETURN n")
        (True, "MATCH (n) RETURN n LIMIT 1000", "")

        >>> validate_and_prepare("CREATE (n) RETURN n")
        (False, "", "Write operation 'CREATE' not allowed in read-only mode")
    """
    # Sanitize query
    cleaned = sanitize_query(query)

    if not cleaned:
        return False, "", "Query cannot be empty after sanitization"

    # Validate query
    is_valid, error_msg = validate_cypher(cleaned, allow_write=allow_write)

    if not is_valid:
        return False, "", error_msg

    # Inject limit if requested
    if auto_limit:
        prepared = inject_limit(cleaned, limit=limit)
    else:
        prepared = cleaned

    return True, prepared, ""


if __name__ == "__main__":
    # Simple CLI for testing
    import sys

    if len(sys.argv) < 2:
        print("Usage: python validate.py <query>")
        print("\nExample:")
        print('  python validate.py "MATCH (n) RETURN n"')
        sys.exit(1)

    query = sys.argv[1]
    is_valid, prepared, error = validate_and_prepare(query)

    if is_valid:
        print("✓ Query is valid")
        print(f"\nPrepared query:\n{prepared}")
    else:
        print(f"✗ Validation failed: {error}")
        sys.exit(1)
