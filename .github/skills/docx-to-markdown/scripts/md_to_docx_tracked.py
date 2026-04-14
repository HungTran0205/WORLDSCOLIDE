#!/usr/bin/env python3
"""
Convert Markdown with track change markers to Word documents with native track changes.

Markdown Track Change Syntax:
    **text**         → Insertion (track changes)
    ~~text~~         → Deletion (track changes)
    *[SOW-ID Rxx.x]* → Comment with reference

Usage:
    python md_to_docx_tracked.py <input.md> <output.docx> [options]
    
Examples:
    # Apply changes to existing document
    python md_to_docx_tracked.py changes.md updated.docx --base original.docx
    
    # Create new document with track changes
    python md_to_docx_tracked.py changes.md output.docx
    
    # Custom author name
    python md_to_docx_tracked.py changes.md output.docx --author "John Doe"

Options:
    --base <file>        Base Word document to apply changes to
    --author <name>      Author name for track changes (default: "AI Agent")
    --no-track-changes   Disable track changes (apply directly)
    
License: MIT
"""

import sys
import re
import shutil
from pathlib import Path
from typing import List, Dict, Tuple, Optional

try:
    import win32com.client
    WIN32_AVAILABLE = True
except ImportError:
    WIN32_AVAILABLE = False

try:
    from docx import Document
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    PYTHON_DOCX_AVAILABLE = True
except ImportError:
    PYTHON_DOCX_AVAILABLE = False


class TrackChange:
    """Represents a single track change (insertion, deletion, or comment)."""
    
    def __init__(self, type: str, text: str, reference: str = None, position: int = 0):
        self.type = type  # 'insertion', 'deletion', 'comment'
        self.text = text
        self.reference = reference  # SOW reference for comments
        self.position = position  # Character position in document


def parse_markdown_changes(markdown_content: str) -> Tuple[str, List[TrackChange]]:
    """
    Parse markdown content and extract track changes.
    
    Returns:
        Tuple of (clean_text, list of TrackChange objects)
    """
    changes = []
    
    # Pattern for insertions: **text**
    insertion_pattern = r'\*\*(.+?)\*\*'
    
    # Pattern for deletions: ~~text~~
    deletion_pattern = r'~~(.+?)~~'
    
    # Pattern for comments: *[SOW-ID Rxx.x]*
    comment_pattern = r'\*\[(.+?)\]\*'
    
    # Find all changes with positions
    for match in re.finditer(insertion_pattern, markdown_content):
        changes.append(TrackChange(
            type='insertion',
            text=match.group(1),
            position=match.start()
        ))
    
    for match in re.finditer(deletion_pattern, markdown_content):
        changes.append(TrackChange(
            type='deletion',
            text=match.group(1),
            position=match.start()
        ))
    
    for match in re.finditer(comment_pattern, markdown_content):
        changes.append(TrackChange(
            type='comment',
            text='',
            reference=match.group(1),
            position=match.start()
        ))
    
    # Sort by position
    changes.sort(key=lambda x: x.position)
    
    # Create clean text (remove markers)
    clean_text = markdown_content
    clean_text = re.sub(insertion_pattern, r'\1', clean_text)  # Keep inserted text
    clean_text = re.sub(deletion_pattern, '', clean_text)  # Remove deleted text
    clean_text = re.sub(comment_pattern, '', clean_text)  # Remove comment markers
    
    return clean_text, changes


def apply_changes_with_win32com(
    output_path: Path,
    base_path: Optional[Path],
    changes: List[TrackChange],
    author: str = "AI Agent"
) -> None:
    """
    Apply track changes using win32com (Windows only).
    
    Args:
        output_path: Output Word document path
        base_path: Optional base document to modify
        changes: List of TrackChange objects
        author: Author name for track changes
    """
    if not WIN32_AVAILABLE:
        raise RuntimeError(
            "win32com not available. Please run: pip install pywin32\n"
            "Or use --no-track-changes flag for basic conversion."
        )
    
    print(f"🚀 Starting Microsoft Word...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    
    doc = None
    try:
        # Open base document or create new
        if base_path and base_path.exists():
            print(f"📖 Opening base document: {base_path.name}")
            # Copy base to output first
            shutil.copy(base_path, output_path)
            doc = word.Documents.Open(str(output_path.absolute()))
        else:
            print("📄 Creating new document")
            doc = word.Documents.Add()
        
        # Enable track changes
        print("✅ Enabling Track Changes...")
        doc.TrackRevisions = True
        doc.TrackFormatting = True
        
        # Set author name
        word.UserName = author
        word.UserInitials = "".join([word[0].upper() for word in author.split()[:2]])
        
        # Get selection object
        selection = word.Selection
        
        # Move to end of document
        selection.EndKey(Unit=6)  # wdStory = 6
        
        print(f"✏️  Applying {len(changes)} track changes...")
        
        # Apply changes
        for i, change in enumerate(changes, 1):
            if change.type == 'insertion':
                # Insert text with tracking
                selection.TypeParagraph()
                selection.TypeText(change.text)
                print(f"  ✓ [{i}/{len(changes)}] Insertion: {change.text[:50]}...")
                
            elif change.type == 'deletion':
                # For deletions, we need existing text to delete
                # This is a limitation - we'll add as comment instead
                selection.TypeParagraph()
                comment_text = f"DELETION: {change.text}"
                comment_range = selection.Range
                doc.Comments.Add(comment_range, comment_text)
                print(f"  ✓ [{i}/{len(changes)}] Deletion marked as comment: {change.text[:50]}...")
                
            elif change.type == 'comment':
                # Add comment with SOW reference
                selection.TypeParagraph()
                comment_range = selection.Range
                doc.Comments.Add(comment_range, change.reference)
                print(f"  ✓ [{i}/{len(changes)}] Comment: {change.reference}")
        
        # Save document
        print(f"\n💾 Saving document...")
        if not output_path.exists():
            doc.SaveAs(str(output_path.absolute()))
        else:
            doc.Save()
        
        # Get statistics
        revision_count = doc.Revisions.Count
        comment_count = doc.Comments.Count
        
        print(f"\n{'='*70}")
        print(f"✅ SUCCESS! Created {output_path.name} with Track Changes")
        print(f"{'='*70}")
        print(f"📁 Location: {output_path}")
        print(f"📊 Track Changes Summary:")
        print(f"   • Revisions tracked: {revision_count}")
        print(f"   • Comments added: {comment_count}")
        print(f"\n📂 Open {output_path.name} in Word to review all track changes!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
        
    finally:
        if doc:
            doc.Close(SaveChanges=True)
        word.Quit()
        print("\n✅ Microsoft Word closed")


def apply_changes_with_python_docx(
    output_path: Path,
    base_path: Optional[Path],
    changes: List[TrackChange],
    author: str = "AI Agent"
) -> None:
    """
    Apply track changes using python-docx (cross-platform, limited features).
    
    Note: python-docx has limited track changes support.
    This is a basic implementation.
    """
    if not PYTHON_DOCX_AVAILABLE:
        raise RuntimeError(
            "python-docx not available. Please run: pip install python-docx"
        )
    
    print(f"📝 Using python-docx (limited track changes support)...")
    
    # Open base document or create new
    if base_path and base_path.exists():
        print(f"📖 Opening base document: {base_path.name}")
        doc = Document(str(base_path))
    else:
        print("📄 Creating new document")
        doc = Document()
    
    # Add changes as paragraphs with notes
    print(f"✏️  Adding {len(changes)} changes...")
    
    for i, change in enumerate(changes, 1):
        if change.type == 'insertion':
            para = doc.add_paragraph()
            run = para.add_run(change.text)
            run.bold = True  # Mark insertions in bold
            print(f"  ✓ [{i}/{len(changes)}] Insertion: {change.text[:50]}...")
            
        elif change.type == 'deletion':
            para = doc.add_paragraph()
            run = para.add_run(f"[DELETED: {change.text}]")
            run.font.strike = True
            print(f"  ✓ [{i}/{len(changes)}] Deletion: {change.text[:50]}...")
            
        elif change.type == 'comment':
            para = doc.add_paragraph()
            run = para.add_run(f"[COMMENT: {change.reference}]")
            run.italic = True
            print(f"  ✓ [{i}/{len(changes)}] Comment: {change.reference}")
    
    # Save
    print(f"\n💾 Saving document...")
    doc.save(str(output_path))
    
    print(f"\n✅ Created: {output_path}")
    print(f"⚠️  Note: python-docx has limited track changes support.")
    print(f"   Changes are marked with formatting instead of native track changes.")


def markdown_to_docx_tracked(
    input_file: str,
    output_file: str,
    base_doc: str = None,
    author: str = "AI Agent",
    use_win32: bool = None
) -> None:
    """
    Convert markdown with track changes to Word.
    
    Args:
        input_file: Input markdown file
        output_file: Output Word document
        base_doc: Optional base document to modify
        author: Author name for track changes
        use_win32: Force win32com (True) or python-docx (False), auto-detect if None
    """
    input_path = Path(input_file)
    output_path = Path(output_file)
    base_path = Path(base_doc) if base_doc else None
    
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_file}")
    
    # Read markdown
    print(f"📖 Reading markdown: {input_path.name}")
    markdown_content = input_path.read_text(encoding='utf-8')
    
    # Parse changes
    print("🔍 Parsing track change markers...")
    clean_text, changes = parse_markdown_changes(markdown_content)
    
    print(f"✅ Found {len(changes)} track changes:")
    insertions = sum(1 for c in changes if c.type == 'insertion')
    deletions = sum(1 for c in changes if c.type == 'deletion')
    comments = sum(1 for c in changes if c.type == 'comment')
    print(f"   • Insertions: {insertions}")
    print(f"   • Deletions: {deletions}")
    print(f"   • Comments: {comments}")
    
    # Determine which method to use
    if use_win32 is None:
        use_win32 = WIN32_AVAILABLE  # Prefer win32com if available
    
    if use_win32:
        apply_changes_with_win32com(output_path, base_path, changes, author)
    else:
        apply_changes_with_python_docx(output_path, base_path, changes, author)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    base_doc = None
    author = "AI Agent"
    use_win32 = None
    
    # Parse options
    args = sys.argv[3:]
    i = 0
    while i < len(args):
        arg = args[i]
        if arg == '--base':
            if i + 1 < len(args):
                base_doc = args[i + 1]
                i += 1
        elif arg == '--author':
            if i + 1 < len(args):
                author = args[i + 1]
                i += 1
        elif arg == '--no-track-changes':
            use_win32 = False
        i += 1
    
    try:
        markdown_to_docx_tracked(
            input_file,
            output_file,
            base_doc=base_doc,
            author=author,
            use_win32=use_win32
        )
        
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
