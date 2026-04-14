#!/usr/bin/env python3
"""
DocxEditor - Edit Word documents with tracked changes and comments.

Usage:
    from docx_editor import DocxEditor
    
    editor = DocxEditor('./unpacked')
    node = editor.get_node("word/document.xml", tag="w:p", contains="target text")
    editor.add_insertion(node, "new text", author="Reviewer")
    editor.save()

Author: Custom implementation based on OOXML specification (ECMA-376)
License: MIT
"""

import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Union

try:
    import defusedxml.minidom as minidom
except ImportError:
    raise ImportError("defusedxml required. Install with: pip install defusedxml")


def generate_rsid() -> str:
    """Generate random 8-character hex RSID."""
    return ''.join(random.choices('0123456789ABCDEF', k=8))


def generate_hex_id() -> str:
    """Generate random 8-character hex ID for paraId/textId."""
    return ''.join(random.choices('0123456789ABCDEF', k=8))


class DocxEditor:
    """
    Editor for Word documents with support for tracked changes and comments.
    
    Attributes:
        base_path: Path to unpacked document directory
        rsid: Revision Save ID for this editing session
        author: Author name for tracked changes
        initials: Author initials for comments
    """
    
    def __init__(
        self, 
        base_path: str, 
        author: str = "Reviewer",
        initials: str = "R",
        rsid: Optional[str] = None
    ):
        """
        Initialize editor for an unpacked document.
        
        Args:
            base_path: Path to unpacked document directory
            author: Author name for tracked changes and comments
            initials: Author initials for comments
            rsid: RSID for this session (auto-generated if not provided)
        """
        self.base_path = Path(base_path)
        self.author = author
        self.initials = initials
        self.rsid = rsid or generate_rsid()
        self._dom_cache = {}
        
        if not self.base_path.is_dir():
            raise ValueError(f"Not a directory: {base_path}")
        
        doc_xml = self.base_path / "word" / "document.xml"
        if not doc_xml.exists():
            raise ValueError(f"Not a valid unpacked docx: {base_path}")
    
    def _get_dom(self, rel_path: str):
        """Get or load DOM for a file."""
        if rel_path not in self._dom_cache:
            file_path = self.base_path / rel_path
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            self._dom_cache[rel_path] = minidom.parse(str(file_path))
        return self._dom_cache[rel_path]
    
    def _get_timestamp(self) -> str:
        """Get current UTC timestamp in ISO 8601 format."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    def _get_next_id(self, dom, tags: tuple = ('w:ins', 'w:del', 'w:comment')) -> int:
        """Get next available ID by scanning existing elements."""
        max_id = -1
        for tag in tags:
            for elem in dom.getElementsByTagName(tag):
                try:
                    elem_id = elem.getAttribute('w:id')
                    if elem_id:
                        max_id = max(max_id, int(elem_id))
                except ValueError:
                    pass
        return max_id + 1
    
    def _get_element_text(self, elem) -> str:
        """Get all text content from an element and its descendants."""
        text_parts = []
        for node in elem.childNodes:
            if node.nodeType == node.TEXT_NODE:
                text_parts.append(node.data)
            elif node.nodeType == node.ELEMENT_NODE:
                text_parts.append(self._get_element_text(node))
        return ''.join(text_parts)
    
    def get_node(
        self,
        rel_path: str,
        tag: str,
        attrs: Optional[dict] = None,
        line_number: Optional[Union[int, range]] = None,
        contains: Optional[str] = None
    ):
        """
        Find a DOM element by tag and filters.
        
        Args:
            rel_path: Relative path to XML file (e.g., "word/document.xml")
            tag: XML tag name (e.g., "w:p", "w:r", "w:del")
            attrs: Dictionary of attribute name-value pairs to match
            line_number: Line number or range in formatted XML (approximate)
            contains: Text that must appear within the element
            
        Returns:
            Matching DOM element
            
        Raises:
            ValueError: If no match or multiple matches found
        """
        dom = self._get_dom(rel_path)
        matches = []
        
        for elem in dom.getElementsByTagName(tag):
            # Filter by attributes
            if attrs:
                if not all(elem.getAttribute(k) == v for k, v in attrs.items()):
                    continue
            
            # Filter by text content
            if contains:
                elem_text = self._get_element_text(elem)
                if contains not in elem_text:
                    continue
            
            matches.append(elem)
        
        if not matches:
            filters = [f"tag={tag}"]
            if attrs:
                filters.append(f"attrs={attrs}")
            if contains:
                filters.append(f"contains='{contains}'")
            raise ValueError(f"No element found matching: {', '.join(filters)}")
        
        if len(matches) > 1 and not contains:
            raise ValueError(
                f"Multiple elements ({len(matches)}) found for tag={tag}. "
                "Add 'contains' or 'attrs' filter to narrow down."
            )
        
        return matches[0]
    
    def add_insertion(
        self,
        after_node,
        text: str,
        author: Optional[str] = None
    ):
        """
        Add tracked insertion after a node.
        
        Args:
            after_node: Insert after this DOM element
            text: Text to insert
            author: Author name (uses default if not provided)
        """
        dom = after_node.ownerDocument
        author = author or self.author
        timestamp = self._get_timestamp()
        
        # Create insertion element
        ins_elem = dom.createElement('w:ins')
        ins_elem.setAttribute('w:id', str(self._get_next_id(dom)))
        ins_elem.setAttribute('w:author', author)
        ins_elem.setAttribute('w:date', timestamp)
        
        # Create run with text
        run = dom.createElement('w:r')
        run.setAttribute('w:rsidR', self.rsid)
        
        t_elem = dom.createElement('w:t')
        if text.startswith(' ') or text.endswith(' '):
            t_elem.setAttribute('xml:space', 'preserve')
        t_elem.appendChild(dom.createTextNode(text))
        
        run.appendChild(t_elem)
        ins_elem.appendChild(run)
        
        # Insert into DOM
        parent = after_node.parentNode
        next_sibling = after_node.nextSibling
        if next_sibling:
            parent.insertBefore(ins_elem, next_sibling)
        else:
            parent.appendChild(ins_elem)
        
        return ins_elem
    
    def add_deletion(
        self,
        target_node,
        author: Optional[str] = None
    ):
        """
        Wrap a node's content in tracked deletion.
        
        Args:
            target_node: Node to mark as deleted (w:r or w:p)
            author: Author name (uses default if not provided)
        """
        dom = target_node.ownerDocument
        author = author or self.author
        timestamp = self._get_timestamp()
        
        # Create deletion wrapper
        del_elem = dom.createElement('w:del')
        del_elem.setAttribute('w:id', str(self._get_next_id(dom)))
        del_elem.setAttribute('w:author', author)
        del_elem.setAttribute('w:date', timestamp)
        
        # Handle based on target type
        if target_node.tagName == 'w:r':
            # Clone the run and convert w:t to w:delText
            cloned = target_node.cloneNode(True)
            cloned.setAttribute('w:rsidDel', self.rsid)
            if cloned.hasAttribute('w:rsidR'):
                cloned.removeAttribute('w:rsidR')
            
            for t_elem in cloned.getElementsByTagName('w:t'):
                del_text = dom.createElement('w:delText')
                # Copy text content
                while t_elem.firstChild:
                    del_text.appendChild(t_elem.firstChild)
                # Copy attributes
                for i in range(t_elem.attributes.length):
                    attr = t_elem.attributes.item(i)
                    del_text.setAttribute(attr.name, attr.value)
                t_elem.parentNode.replaceChild(del_text, t_elem)
            
            del_elem.appendChild(cloned)
            
            # Replace original with deletion
            target_node.parentNode.replaceChild(del_elem, target_node)
        
        return del_elem
    
    def tracked_replace(
        self,
        target_node,
        old_text: str,
        new_text: str,
        author: Optional[str] = None
    ):
        """
        Replace text with tracked deletion and insertion.
        
        Args:
            target_node: Node containing text to replace
            old_text: Text to delete
            new_text: Text to insert
            author: Author name
        """
        dom = target_node.ownerDocument
        author = author or self.author
        timestamp = self._get_timestamp()
        parent = target_node.parentNode
        
        # Create deletion
        del_elem = dom.createElement('w:del')
        del_elem.setAttribute('w:id', str(self._get_next_id(dom)))
        del_elem.setAttribute('w:author', author)
        del_elem.setAttribute('w:date', timestamp)
        
        del_run = dom.createElement('w:r')
        del_run.setAttribute('w:rsidDel', self.rsid)
        del_text = dom.createElement('w:delText')
        del_text.appendChild(dom.createTextNode(old_text))
        del_run.appendChild(del_text)
        del_elem.appendChild(del_run)
        
        # Create insertion
        ins_elem = dom.createElement('w:ins')
        ins_elem.setAttribute('w:id', str(self._get_next_id(dom)))
        ins_elem.setAttribute('w:author', author)
        ins_elem.setAttribute('w:date', timestamp)
        
        ins_run = dom.createElement('w:r')
        ins_run.setAttribute('w:rsidR', self.rsid)
        ins_text = dom.createElement('w:t')
        if new_text.startswith(' ') or new_text.endswith(' '):
            ins_text.setAttribute('xml:space', 'preserve')
        ins_text.appendChild(dom.createTextNode(new_text))
        ins_run.appendChild(ins_text)
        ins_elem.appendChild(ins_run)
        
        # Insert before target, then remove target
        parent.insertBefore(del_elem, target_node)
        parent.insertBefore(ins_elem, target_node)
        parent.removeChild(target_node)
        
        return del_elem, ins_elem
    
    def add_comment(
        self,
        start_node,
        end_node,
        comment_text: str,
        author: Optional[str] = None,
        initials: Optional[str] = None
    ):
        """
        Add a comment to a range of content.
        
        Args:
            start_node: Node where comment range starts
            end_node: Node where comment range ends
            comment_text: Text of the comment
            author: Author name
            initials: Author initials
        """
        doc_dom = start_node.ownerDocument
        author = author or self.author
        initials = initials or self.initials
        timestamp = self._get_timestamp()
        
        # Get next comment ID
        comment_id = str(self._get_next_id(doc_dom, ('w:comment', 'w:commentRangeStart')))
        
        # Add comment range markers in document.xml
        range_start = doc_dom.createElement('w:commentRangeStart')
        range_start.setAttribute('w:id', comment_id)
        
        range_end = doc_dom.createElement('w:commentRangeEnd')
        range_end.setAttribute('w:id', comment_id)
        
        # Create comment reference
        ref_run = doc_dom.createElement('w:r')
        ref = doc_dom.createElement('w:commentReference')
        ref.setAttribute('w:id', comment_id)
        ref_run.appendChild(ref)
        
        # Insert markers
        start_parent = start_node.parentNode
        start_parent.insertBefore(range_start, start_node)
        
        end_parent = end_node.parentNode
        end_next = end_node.nextSibling
        if end_next:
            end_parent.insertBefore(range_end, end_next)
            end_parent.insertBefore(ref_run, end_next)
        else:
            end_parent.appendChild(range_end)
            end_parent.appendChild(ref_run)
        
        # Add comment to comments.xml
        self._ensure_comments_file()
        comments_dom = self._get_dom("word/comments.xml")
        comments_root = comments_dom.documentElement
        
        comment_elem = comments_dom.createElement('w:comment')
        comment_elem.setAttribute('w:id', comment_id)
        comment_elem.setAttribute('w:author', author)
        comment_elem.setAttribute('w:date', timestamp)
        comment_elem.setAttribute('w:initials', initials)
        
        # Add comment text in a paragraph
        para = comments_dom.createElement('w:p')
        para.setAttribute('w:rsidR', self.rsid)
        para.setAttribute('w:rsidRDefault', self.rsid)
        
        run = comments_dom.createElement('w:r')
        t_elem = comments_dom.createElement('w:t')
        t_elem.appendChild(comments_dom.createTextNode(comment_text))
        run.appendChild(t_elem)
        para.appendChild(run)
        comment_elem.appendChild(para)
        
        comments_root.appendChild(comment_elem)
        
        return comment_id
    
    def _ensure_comments_file(self):
        """Ensure comments.xml exists and is properly linked."""
        comments_path = self.base_path / "word" / "comments.xml"
        
        if not comments_path.exists():
            # Create basic comments.xml
            comments_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml">
</w:comments>'''
            comments_path.write_text(comments_xml, encoding='utf-8')
            
            # Add to relationships
            self._add_relationship(
                "word/_rels/document.xml.rels",
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments",
                "comments.xml"
            )
            
            # Add to content types
            self._add_content_type(
                "/word/comments.xml",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"
            )
    
    def _add_relationship(self, rels_path: str, rel_type: str, target: str):
        """Add a relationship to a .rels file."""
        full_path = self.base_path / rels_path
        
        if full_path.exists():
            dom = minidom.parse(str(full_path))
        else:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            dom = minidom.parseString(
                '<?xml version="1.0" encoding="UTF-8"?>'
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'
            )
        
        root = dom.documentElement
        
        # Check if relationship already exists
        for rel in root.getElementsByTagName('Relationship'):
            if rel.getAttribute('Target') == target:
                return
        
        # Find next rId
        max_id = 0
        for rel in root.getElementsByTagName('Relationship'):
            rid = rel.getAttribute('Id')
            if rid.startswith('rId'):
                try:
                    max_id = max(max_id, int(rid[3:]))
                except ValueError:
                    pass
        
        # Create new relationship
        new_rel = dom.createElement('Relationship')
        new_rel.setAttribute('Id', f'rId{max_id + 1}')
        new_rel.setAttribute('Type', rel_type)
        new_rel.setAttribute('Target', target)
        root.appendChild(new_rel)
        
        full_path.write_bytes(dom.toxml(encoding='UTF-8'))
    
    def _add_content_type(self, part_name: str, content_type: str):
        """Add content type override to [Content_Types].xml."""
        ct_path = self.base_path / "[Content_Types].xml"
        dom = minidom.parse(str(ct_path))
        root = dom.documentElement
        
        # Check if override already exists
        for override in root.getElementsByTagName('Override'):
            if override.getAttribute('PartName') == part_name:
                return
        
        # Add new override
        new_override = dom.createElement('Override')
        new_override.setAttribute('PartName', part_name)
        new_override.setAttribute('ContentType', content_type)
        root.appendChild(new_override)
        
        ct_path.write_bytes(dom.toxml(encoding='UTF-8'))
    
    def save(self):
        """Save all modified DOM documents."""
        for rel_path, dom in self._dom_cache.items():
            file_path = self.base_path / rel_path
            file_path.write_bytes(dom.toxml(encoding='UTF-8'))
        print(f"Saved changes to: {self.base_path}")


# Convenience function for simple text replacement
def simple_replace(unpacked_dir: str, old_text: str, new_text: str):
    """
    Simple text replacement without tracked changes.
    
    Args:
        unpacked_dir: Path to unpacked document
        old_text: Text to find
        new_text: Replacement text
    """
    doc_path = Path(unpacked_dir) / "word" / "document.xml"
    dom = minidom.parse(str(doc_path))
    
    for t_elem in dom.getElementsByTagName('w:t'):
        if t_elem.firstChild and t_elem.firstChild.nodeType == t_elem.TEXT_NODE:
            if old_text in t_elem.firstChild.data:
                t_elem.firstChild.data = t_elem.firstChild.data.replace(old_text, new_text)
    
    doc_path.write_bytes(dom.toxml(encoding='UTF-8'))
    print(f"Replaced '{old_text}' with '{new_text}'")
