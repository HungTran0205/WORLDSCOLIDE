#!/usr/bin/env python3
"""
Convert Markdown files to Word documents (.docx) using pypandoc.

Usage:
    python md_to_docx.py <input.md> <output.docx> [options]
    
Examples:
    python md_to_docx.py document.md output.docx
    python md_to_docx.py document.md output.docx --reference-doc template.docx
    python md_to_docx.py document.md output.docx --toc

Options:
    --reference-doc <file>    Use Word template for styling
    --toc                     Generate table of contents
    --number-sections         Number section headings
    
License: MIT
"""

import sys
from pathlib import Path

try:
    import pypandoc
except ImportError:
    pypandoc = None


def markdown_to_docx(
    input_file: str,
    output_file: str,
    reference_doc: str = None,
    toc: bool = False,
    number_sections: bool = False
) -> None:
    """
    Convert Markdown to .docx using pypandoc.
    
    Args:
        input_file: Path to .md file
        output_file: Path to output .docx file
        reference_doc: Optional Word template for styling
        toc: Generate table of contents
        number_sections: Number section headings
    """
    input_path = Path(input_file)
    output_path = Path(output_file)
    
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_file}")
    
    if input_path.suffix.lower() not in ['.md', '.markdown']:
        raise ValueError(f"Expected .md or .markdown file, got: {input_path.suffix}")
    
    if pypandoc is None:
        raise RuntimeError(
            "pypandoc not found. Please run: pip install pypandoc_binary"
        )
    
    # Build extra args
    extra_args = ['--wrap=none']
    
    if reference_doc:
        ref_path = Path(reference_doc)
        if not ref_path.exists():
            raise FileNotFoundError(f"Reference document not found: {reference_doc}")
        extra_args.append(f'--reference-doc={reference_doc}')
    
    if toc:
        extra_args.append('--toc')
    
    if number_sections:
        extra_args.append('--number-sections')
    
    try:
        # Convert markdown to Word
        pypandoc.convert_file(
            str(input_path),
            'docx',
            outputfile=str(output_path),
            extra_args=extra_args
        )
        
        print(f"✅ Converted: {input_path} → {output_path}")
        
    except Exception as e:
        raise RuntimeError(f"Conversion failed: {e}")


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    reference_doc = None
    toc = False
    number_sections = False
    
    # Parse options
    args = sys.argv[3:]
    i = 0
    while i < len(args):
        arg = args[i]
        if arg == '--reference-doc':
            if i + 1 < len(args):
                reference_doc = args[i + 1]
                i += 1
        elif arg == '--toc':
            toc = True
        elif arg == '--number-sections':
            number_sections = True
        i += 1
    
    try:
        markdown_to_docx(
            input_file, 
            output_file, 
            reference_doc=reference_doc,
            toc=toc,
            number_sections=number_sections
        )
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
