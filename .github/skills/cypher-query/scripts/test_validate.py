#!/usr/bin/env python3
"""Unit tests for validate.py module."""

import unittest
from validate import (
    validate_cypher,
    inject_limit,
    sanitize_query,
    validate_and_prepare,
)


class TestValidateCypher(unittest.TestCase):
    """Test cases for validate_cypher function."""

    def test_valid_read_query(self):
        """Test that valid MATCH...RETURN queries pass."""
        query = "MATCH (n:Function) RETURN n.name"
        is_valid, error = validate_cypher(query)
        self.assertTrue(is_valid)
        self.assertEqual(error, "")

    def test_blocks_create(self):
        """Test that CREATE operations are blocked."""
        query = "CREATE (n:Node {name: 'test'}) RETURN n"
        is_valid, error = validate_cypher(query)
        self.assertFalse(is_valid)
        self.assertIn("CREATE", error)

    def test_blocks_delete(self):
        """Test that DELETE operations are blocked."""
        query = "MATCH (n) DELETE n"
        is_valid, error = validate_cypher(query)
        self.assertFalse(is_valid)
        self.assertIn("DELETE", error)

    def test_blocks_merge(self):
        """Test that MERGE operations are blocked."""
        query = "MERGE (n:Node {id: 1}) RETURN n"
        is_valid, error = validate_cypher(query)
        self.assertFalse(is_valid)
        self.assertIn("MERGE", error)

    def test_blocks_set(self):
        """Test that SET operations are blocked."""
        query = "MATCH (n) SET n.name = 'new' RETURN n"
        is_valid, error = validate_cypher(query)
        self.assertFalse(is_valid)
        self.assertIn("SET", error)

    def test_requires_match_or_call(self):
        """Test that query must contain MATCH or CALL."""
        query = "RETURN 1"
        is_valid, error = validate_cypher(query)
        self.assertFalse(is_valid)
        self.assertIn("MATCH", error)

    def test_requires_return_or_yield(self):
        """Test that query must contain RETURN or YIELD."""
        query = "MATCH (n:Function)"
        is_valid, error = validate_cypher(query)
        self.assertFalse(is_valid)
        self.assertIn("RETURN", error)

    def test_empty_query(self):
        """Test that empty queries are rejected."""
        is_valid, error = validate_cypher("")
        self.assertFalse(is_valid)
        self.assertIn("empty", error.lower())

    def test_allow_write_mode(self):
        """Test that write operations are allowed when allow_write=True."""
        query = "CREATE (n:Node) RETURN n"
        is_valid, error = validate_cypher(query, allow_write=True)
        # Should still fail because of missing MATCH/CALL
        self.assertFalse(is_valid)


class TestInjectLimit(unittest.TestCase):
    """Test cases for inject_limit function."""

    def test_inject_limit_when_missing(self):
        """Test LIMIT injection when not present."""
        query = "MATCH (n) RETURN n"
        result = inject_limit(query, limit=100)
        self.assertEqual(result, "MATCH (n) RETURN n LIMIT 100")

    def test_preserves_existing_limit(self):
        """Test that existing LIMIT is preserved."""
        query = "MATCH (n) RETURN n LIMIT 50"
        result = inject_limit(query, limit=100)
        self.assertEqual(result, query)

    def test_handles_semicolon(self):
        """Test LIMIT injection with semicolon."""
        query = "MATCH (n) RETURN n;"
        result = inject_limit(query, limit=100)
        self.assertEqual(result, "MATCH (n) RETURN n LIMIT 100;")

    def test_empty_query(self):
        """Test empty query handling."""
        result = inject_limit("")
        self.assertEqual(result, "")

    def test_case_insensitive_limit_check(self):
        """Test that LIMIT detection is case-insensitive."""
        query = "MATCH (n) RETURN n limit 50"
        result = inject_limit(query, limit=100)
        self.assertEqual(result, query)


class TestSanitizeQuery(unittest.TestCase):
    """Test cases for sanitize_query function."""

    def test_removes_code_block_markers(self):
        """Test removal of markdown code blocks."""
        query = "```cypher\nMATCH (n) RETURN n\n```"
        result = sanitize_query(query)
        self.assertEqual(result, "MATCH (n) RETURN n")

    def test_removes_plain_backticks(self):
        """Test removal of plain backticks."""
        query = "```\nMATCH (n) RETURN n\n```"
        result = sanitize_query(query)
        self.assertEqual(result, "MATCH (n) RETURN n")

    def test_removes_cypher_prefix(self):
        """Test removal of 'cypher' prefix."""
        query = "cypher MATCH (n) RETURN n"
        result = sanitize_query(query)
        self.assertEqual(result, "MATCH (n) RETURN n")

    def test_strips_whitespace(self):
        """Test whitespace stripping."""
        query = "  MATCH (n) RETURN n  "
        result = sanitize_query(query)
        self.assertEqual(result, "MATCH (n) RETURN n")

    def test_empty_query(self):
        """Test empty query handling."""
        result = sanitize_query("")
        self.assertEqual(result, "")


class TestValidateAndPrepare(unittest.TestCase):
    """Test cases for validate_and_prepare function."""

    def test_complete_workflow(self):
        """Test complete validation and preparation."""
        query = "MATCH (n:Function) RETURN n.name"
        is_valid, prepared, error = validate_and_prepare(query)
        self.assertTrue(is_valid)
        self.assertIn("LIMIT", prepared)
        self.assertEqual(error, "")

    def test_sanitize_and_validate(self):
        """Test sanitization before validation."""
        query = "```cypher\nMATCH (n) RETURN n\n```"
        is_valid, prepared, error = validate_and_prepare(query)
        self.assertTrue(is_valid)
        self.assertNotIn("```", prepared)

    def test_blocks_invalid_queries(self):
        """Test that invalid queries are blocked."""
        query = "CREATE (n) RETURN n"
        is_valid, prepared, error = validate_and_prepare(query)
        self.assertFalse(is_valid)
        self.assertEqual(prepared, "")
        self.assertIn("CREATE", error)

    def test_disable_auto_limit(self):
        """Test disabling auto-limit."""
        query = "MATCH (n) RETURN count(n)"
        is_valid, prepared, error = validate_and_prepare(query, auto_limit=False)
        self.assertTrue(is_valid)
        self.assertNotIn("LIMIT", prepared)

    def test_custom_limit(self):
        """Test custom limit value."""
        query = "MATCH (n) RETURN n"
        is_valid, prepared, error = validate_and_prepare(query, limit=500)
        self.assertTrue(is_valid)
        self.assertIn("LIMIT 500", prepared)


if __name__ == "__main__":
    unittest.main()
