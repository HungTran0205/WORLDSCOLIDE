"""
DOCX editing scripts for gh-nova-tm.

License: MIT
"""

from .docx_editor import DocxEditor, simple_replace, generate_rsid
from .docx_to_md import docx_to_markdown

__all__ = ['DocxEditor', 'simple_replace', 'generate_rsid', 'docx_to_markdown']
