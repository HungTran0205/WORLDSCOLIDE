#!/usr/bin/env python3
"""
Unpack Office files (.docx, .pptx, .xlsx) into directory with formatted XML.

Usage:
    python unpack.py <office_file> <output_directory>
    
Example:
    python unpack.py document.docx ./unpacked

Author: Custom implementation based on OOXML specification (ECMA-376)
License: MIT
"""

import random
import sys
import zipfile
from pathlib import Path

try:
    import defusedxml.minidom as minidom
except ImportError:
    print("Error: defusedxml required. Install with: pip install defusedxml")
    sys.exit(1)


def unpack_office_file(input_file: str, output_dir: str) -> str:
    """
    Unpack an Office file and format XML contents for readability.
    
    Args:
        input_file: Path to .docx, .pptx, or .xlsx file
        output_dir: Directory to extract contents to
        
    Returns:
        Suggested RSID for editing session (for .docx files)
    """
    input_path = Path(input_file)
    output_path = Path(output_dir)
    
    # Validate input
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_file}")
    
    valid_extensions = {'.docx', '.pptx', '.xlsx'}
    if input_path.suffix.lower() not in valid_extensions:
        raise ValueError(f"Unsupported file type. Expected: {valid_extensions}")
    
    # Create output directory
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Extract ZIP contents
    with zipfile.ZipFile(input_path, 'r') as zf:
        zf.extractall(output_path)
    
    # Pretty print all XML and relationship files
    xml_patterns = ['**/*.xml', '**/*.rels']
    for pattern in xml_patterns:
        for xml_file in output_path.glob(pattern):
            try:
                content = xml_file.read_text(encoding='utf-8')
                dom = minidom.parseString(content)
                # Format with 2-space indent, ASCII encoding for compatibility
                formatted = dom.toprettyxml(indent="  ", encoding="ascii")
                xml_file.write_bytes(formatted)
            except Exception as e:
                print(f"Warning: Could not format {xml_file}: {e}", file=sys.stderr)
    
    # Generate suggested RSID for .docx files
    suggested_rsid = ""
    if input_path.suffix.lower() == '.docx':
        suggested_rsid = ''.join(random.choices('0123456789ABCDEF', k=8))
        print(f"Suggested RSID for edit session: {suggested_rsid}")
    
    print(f"Unpacked to: {output_path}")
    return suggested_rsid


def main():
    if len(sys.argv) != 3:
        print("Usage: python unpack.py <office_file> <output_directory>")
        print("Example: python unpack.py document.docx ./unpacked")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    try:
        unpack_office_file(input_file, output_dir)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
