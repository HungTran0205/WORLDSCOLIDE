import unittest
import os
import sys

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class TestDocxScripts(unittest.TestCase):

    def test_imports(self):
        """Test that all scripts can be imported without error."""
        try:
            import docx_editor
            import docx_to_md
            import pack
            import unpack
        except ImportError as e:
            self.fail(f"Failed to import scripts: {e}")

    def test_docx_editor_class_exists(self):
        """Test that DocxEditor class exists in docx_editor module."""
        import docx_editor
        self.assertTrue(hasattr(docx_editor, 'DocxEditor'), "DocxEditor class not found in docx_editor.py")

if __name__ == '__main__':
    unittest.main()
