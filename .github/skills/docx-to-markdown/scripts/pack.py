#!/usr/bin/env python3
"""
Pack a directory into an Office file (.docx, .pptx, .xlsx).

Usage:
    python pack.py <input_directory> <output_file>
    
Example:
    python pack.py ./unpacked document.docx

Author: Custom implementation based on OOXML specification (ECMA-376)
License: MIT
"""

import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

try:
    import defusedxml.minidom as minidom
except ImportError:
    print("Error: defusedxml required. Install with: pip install defusedxml")
    sys.exit(1)


def condense_xml(xml_file: Path) -> None:
    """
    Remove pretty-printing whitespace from XML file.
    
    Word and other Office apps are sensitive to whitespace in XML files.
    This removes formatting added during unpacking.
    """
    try:
        content = xml_file.read_bytes()
        dom = minidom.parseString(content)
        
        # Get XML without extra whitespace
        # First, remove text nodes that are purely whitespace between elements
        remove_whitespace_nodes(dom)
        
        # Write back without pretty printing
        output = dom.toxml(encoding='UTF-8')
        xml_file.write_bytes(output)
    except Exception as e:
        print(f"Warning: Could not condense {xml_file}: {e}", file=sys.stderr)


def remove_whitespace_nodes(node):
    """Recursively remove whitespace-only text nodes."""
    remove_list = []
    for child in node.childNodes:
        if child.nodeType == child.TEXT_NODE:
            if child.data.strip() == '':
                remove_list.append(child)
        elif child.nodeType == child.ELEMENT_NODE:
            remove_whitespace_nodes(child)
    
    for child in remove_list:
        node.removeChild(child)


def pack_office_file(input_dir: str, output_file: str) -> None:
    """
    Pack a directory into an Office file.
    
    Args:
        input_dir: Path to unpacked Office document directory
        output_file: Path to output .docx, .pptx, or .xlsx file
    """
    input_path = Path(input_dir)
    output_path = Path(output_file)
    
    # Validate input
    if not input_path.is_dir():
        raise ValueError(f"Not a directory: {input_dir}")
    
    valid_extensions = {'.docx', '.pptx', '.xlsx'}
    if output_path.suffix.lower() not in valid_extensions:
        raise ValueError(f"Unsupported file type. Expected: {valid_extensions}")
    
    # Work in temporary directory to avoid modifying original
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_content = Path(temp_dir) / "content"
        shutil.copytree(input_path, temp_content)
        
        # Condense XML files (remove pretty-printing)
        for pattern in ['**/*.xml', '**/*.rels']:
            for xml_file in temp_content.glob(pattern):
                condense_xml(xml_file)
        
        # Create output directory if needed
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Create ZIP archive
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_path in temp_content.rglob('*'):
                if file_path.is_file():
                    arc_name = file_path.relative_to(temp_content)
                    zf.write(file_path, arc_name)
    
    print(f"Created: {output_path}")


def main():
    if len(sys.argv) != 3:
        print("Usage: python pack.py <input_directory> <output_file>")
        print("Example: python pack.py ./unpacked document.docx")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        pack_office_file(input_dir, output_file)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
