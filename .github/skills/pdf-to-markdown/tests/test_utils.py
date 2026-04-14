import unittest
import sys
import os

# Add scripts directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from utils import table_to_markdown

class TestTableToMarkdown(unittest.TestCase):
    def test_empty_table(self):
        self.assertEqual(table_to_markdown([]), "")
        self.assertEqual(table_to_markdown(None), "")

    def test_simple_table(self):
        table = [
            ["ID", "Name"],
            ["1", "Alice"],
            ["2", "Bob"]
        ]
        expected = "| ID | Name |\n|---|---|\n| 1 | Alice |\n| 2 | Bob |"
        self.assertEqual(table_to_markdown(table), expected)

    def test_table_with_none(self):
        table = [
            ["ID", "Val"],
            ["1", None]
        ]
        expected = "| ID | Val |\n|---|---|\n| 1 |  |"
        self.assertEqual(table_to_markdown(table), expected)

    def test_table_padding(self):
        table = [
            ["A", "B"],
            ["1"]
        ]
        expected = "| A | B |\n|---|---|\n| 1 |  |"
        self.assertEqual(table_to_markdown(table), expected)
        
if __name__ == '__main__':
    unittest.main()
