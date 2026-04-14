#!/usr/bin/env python3
"""Cypher query executor with natural language and direct Cypher support.

This script provides a CLI for executing Cypher queries against Memgraph
with validation, formatting, and timeout support.
"""

import argparse
import asyncio
import json
import os
import sys
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from neo4j import GraphDatabase
except ImportError:
    print("Error: neo4j driver not installed")
    print("Install: pip install neo4j")
    sys.exit(1)

# Import local validation
from validate import validate_and_prepare

# Configuration from environment or defaults
MEMGRAPH_HOST = os.getenv("MEMGRAPH_HOST", "localhost")
MEMGRAPH_PORT = int(os.getenv("MEMGRAPH_PORT", "7687"))
MEMGRAPH_URI = f"bolt://{MEMGRAPH_HOST}:{MEMGRAPH_PORT}"


class OutputFormat(str, Enum):
    """Output format options."""
    JSON = "json"
    TABLE = "table"
    MARKDOWN = "markdown"


def format_as_json(results: List[Dict[str, Any]], pretty: bool = True) -> str:
    """Format results as JSON.

    Args:
        results: List of result rows
        pretty: Use pretty printing with indentation

    Returns:
        JSON string
    """
    if pretty:
        return json.dumps(results, indent=2, default=str)
    return json.dumps(results, default=str)


def format_as_table(results: List[Dict[str, Any]], max_width: int = 50) -> str:
    """Format results as plain text table.

    Args:
        results: List of result rows
        max_width: Maximum column width

    Returns:
        Table string
    """
    if not results:
        return "No results"

    # Get column names
    columns = list(results[0].keys())

    # Calculate column widths
    widths = {col: min(len(col), max_width) for col in columns}
    for row in results:
        for col in columns:
            value = str(row.get(col, ""))
            widths[col] = max(widths[col], min(len(value), max_width))

    # Build table
    lines = []

    # Header
    header = " | ".join(col.ljust(widths[col]) for col in columns)
    lines.append(header)
    lines.append("-" * len(header))

    # Rows
    for row in results:
        values = []
        for col in columns:
            value = str(row.get(col, ""))
            if len(value) > max_width:
                value = value[:max_width - 3] + "..."
            values.append(value.ljust(widths[col]))
        lines.append(" | ".join(values))

    return "\n".join(lines)


def format_as_markdown(results: List[Dict[str, Any]], max_width: int = 50) -> str:
    """Format results as Markdown table.

    Args:
        results: List of result rows
        max_width: Maximum column width

    Returns:
        Markdown table string
    """
    if not results:
        return "*No results*"

    # Get column names
    columns = list(results[0].keys())

    # Build markdown table
    lines = []

    # Header
    header = "| " + " | ".join(columns) + " |"
    separator = "| " + " | ".join("---" for _ in columns) + " |"
    lines.append(header)
    lines.append(separator)

    # Rows
    for row in results:
        values = []
        for col in columns:
            value = str(row.get(col, ""))
            # Truncate if too long
            if len(value) > max_width:
                value = value[:max_width - 3] + "..."
            # Escape pipe characters
            value = value.replace("|", "\\|")
            values.append(value)
        lines.append("| " + " | ".join(values) + " |")

    return "\n".join(lines)


def format_results(
    results: List[Dict[str, Any]],
    output_format: OutputFormat = OutputFormat.JSON,
    max_width: int = 50
) -> str:
    """Format query results.

    Args:
        results: List of result rows
        output_format: Desired output format
        max_width: Maximum column width for table formats

    Returns:
        Formatted string
    """
    if output_format == OutputFormat.JSON:
        return format_as_json(results)
    elif output_format == OutputFormat.TABLE:
        return format_as_table(results, max_width)
    elif output_format == OutputFormat.MARKDOWN:
        return format_as_markdown(results, max_width)
    else:
        return format_as_json(results)


async def execute_natural_language_query(
    query: str,
    timeout: int = 30,
    auto_limit: bool = True,
    limit: int = 1000
) -> List[Dict[str, Any]]:
    """Execute natural language query.

    NOTE: Natural language to Cypher conversion requires external LLM service.
    For now, this is a placeholder. Use --cypher flag for direct queries.

    Args:
        query: Natural language query
        timeout: Query timeout in seconds
        auto_limit: Auto-inject LIMIT clause
        limit: Default limit value

    Returns:
        List of result rows
    """
    raise NotImplementedError(
        "Natural language query not yet implemented in standalone mode.\n"
        "Please use --cypher flag to execute direct Cypher queries.\n\n"
        "Example: python query.py --cypher 'MATCH (n) RETURN n LIMIT 10'"
    )


async def execute_cypher_query(
    query: str,
    timeout: int = 30,
    auto_limit: bool = True,
    limit: int = 1000
) -> List[Dict[str, Any]]:
    """Execute Cypher query with validation.

    Args:
        query: Cypher query string
        timeout: Query timeout in seconds
        auto_limit: Auto-inject LIMIT clause
        limit: Default limit value

    Returns:
        List of result rows
    """
    # Validate and prepare query
    is_valid, prepared_query, error = validate_and_prepare(
        query,
        allow_write=False,
        auto_limit=auto_limit,
        limit=limit
    )

    if not is_valid:
        raise ValueError(f"Query validation failed: {error}")

    print(f"✓ Query validated", file=sys.stderr)
    if prepared_query != query.strip():
        print(f"📝 Prepared query:\n{prepared_query}\n", file=sys.stderr)

    # Execute query
    print("🔄 Executing query...", file=sys.stderr)
    
    # Use asyncio.wait_for for timeout
    try:
        results = await asyncio.wait_for(
            _execute_query_sync(prepared_query),
            timeout=timeout
        )
        print(f"✓ Query completed: {len(results)} rows", file=sys.stderr)
        return results
    except asyncio.TimeoutError:
        raise TimeoutError(f"Query timeout after {timeout} seconds")


async def _execute_query_sync(query: str) -> List[Dict[str, Any]]:
    """Execute query synchronously (wrapped for async).

    Args:
        query: Cypher query

    Returns:
        List of result rows
    """
    # Execute in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _execute_query_blocking, query)


def _execute_query_blocking(query: str) -> List[Dict[str, Any]]:
    """Execute query (blocking operation) using Neo4j driver.

    Args:
        query: Cypher query

    Returns:
        List of result rows
    """
    driver = None
    try:
        # Connect to Memgraph using Neo4j Bolt protocol
        driver = GraphDatabase.driver(
            MEMGRAPH_URI,
            auth=None,  # Memgraph doesn't require auth by default
            encrypted=False
        )

        # Execute query
        with driver.session() as session:
            result = session.run(query)
            
            # Convert to list of dicts
            records = []
            for record in result:
                records.append(dict(record))
            
            return records

    except Exception as e:
        raise RuntimeError(f"Query execution failed: {e}")
    finally:
        if driver:
            driver.close()


def parse_args() -> argparse.Namespace:
    """Parse command line arguments.

    Returns:
        Parsed arguments
    """
    parser = argparse.ArgumentParser(
        description="Execute Cypher queries against Memgraph code knowledge graph",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Natural language query
  python query.py "Find all functions that call sendEmail"

  # Direct Cypher query
  python query.py --cypher "MATCH (f:Function) RETURN f.name LIMIT 10"

  # Output as markdown table
  python query.py "List all Python files" --format markdown

  # Disable auto-limit
  python query.py --cypher "MATCH (n) RETURN count(n)" --no-limit
        """
    )

    # Query input (mutually exclusive)
    query_group = parser.add_mutually_exclusive_group(required=True)
    query_group.add_argument(
        "query",
        nargs="?",
        help="Natural language query"
    )
    query_group.add_argument(
        "--cypher",
        "-c",
        help="Direct Cypher query"
    )

    # Output options
    parser.add_argument(
        "--format",
        "-f",
        type=str,
        choices=[f.value for f in OutputFormat],
        default=OutputFormat.JSON.value,
        help="Output format (default: json)"
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=50,
        help="Maximum column width for table formats (default: 50)"
    )

    # Query options
    parser.add_argument(
        "--timeout",
        "-t",
        type=int,
        default=30,
        help="Query timeout in seconds (default: 30)"
    )
    parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=1000,
        help="Default LIMIT value (default: 1000)"
    )
    parser.add_argument(
        "--no-limit",
        action="store_true",
        help="Disable auto-inject LIMIT clause"
    )

    # Debug options
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Verbose output"
    )

    return parser.parse_args()


async def main():
    """Main entry point."""
    args = parse_args()

    try:
        # Execute query
        if args.cypher:
            # Direct Cypher query
            results = await execute_cypher_query(
                args.cypher,
                timeout=args.timeout,
                auto_limit=not args.no_limit,
                limit=args.limit
            )
        else:
            # Natural language query
            results = await execute_natural_language_query(
                args.query,
                timeout=args.timeout,
                auto_limit=not args.no_limit,
                limit=args.limit
            )

        # Format and output results
        output = format_results(
            results,
            output_format=OutputFormat(args.format),
            max_width=args.max_width
        )
        print(output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
