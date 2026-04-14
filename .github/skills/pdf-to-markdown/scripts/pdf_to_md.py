#!/usr/bin/env python3
"""
PDF to Markdown Converter

Converts PDF documents to Markdown format with support for:
- Text extraction with layout preservation
- Table extraction as Markdown tables
- Image extraction and referencing
- OCR for scanned PDFs

MIT License
"""

import argparse
import os
import sys
from pathlib import Path

# Ensure we can import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils import table_to_markdown

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    import pytesseract
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


def extract_images_from_pdf(pdf_path, output_dir):
    """
    Extract images from PDF and save to directory.
    
    Args:
        pdf_path: Path to PDF file
        output_dir: Directory to save images
        
    Returns:
        List of dicts with image info: {page, index, path}
    """
    if PdfReader is None:
        print("Warning: pypdf not installed. Skipping image extraction.")
        return []
    
    os.makedirs(output_dir, exist_ok=True)
    
    reader = PdfReader(pdf_path)
    image_refs = []
    global_idx = 0
    
    for page_num, page in enumerate(reader.pages, 1):
        try:
            if '/Resources' not in page:
                continue
                
            resources = page['/Resources']
            if '/XObject' not in resources:
                continue
                
            xobject = resources['/XObject'].get_object()
            
            for obj_name in xobject:
                obj = xobject[obj_name]
                
                if obj.get('/Subtype') == '/Image':
                    global_idx += 1
                    
                    # Determine file extension based on filter
                    ext = 'png'
                    if '/Filter' in obj:
                        filter_type = obj['/Filter']
                        if isinstance(filter_type, list):
                            filter_type = filter_type[0]
                        if filter_type == '/DCTDecode':
                            ext = 'jpg'
                        elif filter_type == '/JPXDecode':
                            ext = 'jp2'
                    
                    # Save image
                    filename = f"page{page_num}_img{global_idx}.{ext}"
                    filepath = os.path.join(output_dir, filename)
                    
                    try:
                        data = obj._data if hasattr(obj, '_data') else obj.get_data()
                        with open(filepath, 'wb') as f:
                            f.write(data)
                        
                        image_refs.append({
                            'page': page_num,
                            'index': global_idx,
                            'path': filepath,
                            'filename': filename
                        })
                        print(f"Extracted: {filename}")
                    except Exception as e:
                        print(f"Warning: Could not extract image {obj_name}: {e}")
                        
        except Exception as e:
            print(f"Warning: Error processing page {page_num}: {e}")
    
    return image_refs


def extract_text_and_tables(pdf_path, extract_tables=True):
    """
    Extract text and optionally tables from PDF.
    
    Args:
        pdf_path: Path to PDF file
        extract_tables: Whether to extract tables
        
    Returns:
        Dict with pages containing text and tables
    """
    if pdfplumber is None:
        print("Error: pdfplumber not installed. Run: pip install pdfplumber")
        sys.exit(1)
    
    pages = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            page_data = {
                'number': i,
                'text': '',
                'tables': []
            }
            
            # Extract text
            try:
                text = page.extract_text()
                if text:
                    page_data['text'] = text
            except Exception as e:
                print(f"Warning: Could not extract text from page {i}: {e}")
            
            # Extract tables
            if extract_tables:
                try:
                    tables = page.extract_tables()
                    for table in tables:
                        if table and len(table) > 0:
                            page_data['tables'].append(table)
                except Exception as e:
                    print(f"Warning: Could not extract tables from page {i}: {e}")
            
            pages.append(page_data)
    
    return pages


def ocr_pdf(pdf_path, dpi=200):
    """
    OCR scanned PDF to extract text.
    
    Args:
        pdf_path: Path to PDF file
        dpi: DPI for rendering (higher = better quality, slower)
        
    Returns:
        List of page texts
    """
    if not OCR_AVAILABLE:
        print("Error: OCR dependencies not installed.")
        print("Run: pip install pytesseract pdf2image")
        print("Also install tesseract: https://github.com/tesseract-ocr/tesseract")
        sys.exit(1)
    
    pages = []
    images = convert_from_path(pdf_path, dpi=dpi)
    
    for i, image in enumerate(images, 1):
        print(f"OCR processing page {i}/{len(images)}...")
        text = pytesseract.image_to_string(image)
        pages.append({
            'number': i,
            'text': text,
            'tables': []  # OCR doesn't extract table structure
        })
    
    return pages


def generate_markdown(pdf_path, pages, image_refs=None, output_dir=None):
    """
    Generate Markdown content from extracted data.
    
    Args:
        pdf_path: Original PDF path (for title)
        pages: List of page data dicts
        image_refs: List of image reference dicts
        output_dir: Output directory for relative paths
        
    Returns:
        Markdown string
    """
    content = []
    pdf_name = os.path.basename(pdf_path)
    
    content.append(f"# {pdf_name}\n")
    content.append(f"_Converted from PDF_\n")
    
    for page in pages:
        page_num = page['number']
        content.append(f"\n---\n\n## Page {page_num}\n")
        
        # Add image references for this page
        if image_refs:
            page_images = [img for img in image_refs if img['page'] == page_num]
            for img in page_images:
                if output_dir:
                    rel_path = os.path.relpath(img['path'], output_dir)
                else:
                    rel_path = img['filename']
                content.append(f"\n![Image {img['index']}]({rel_path})\n")
        
        # Add text
        if page['text']:
            content.append(f"\n{page['text']}\n")
        
        # Add tables
        for j, table in enumerate(page['tables'], 1):
            content.append(f"\n### Table {j}\n")
            content.append(table_to_markdown(table))
            content.append("")
    
    return "\n".join(content)


def pdf_to_markdown(
    pdf_path,
    output_path=None,
    extract_images_dir=None,
    extract_tables=True,
    use_ocr=False,
    dpi=150,
    page_range=None
):
    """
    Main function to convert PDF to Markdown.
    
    Args:
        pdf_path: Path to input PDF
        output_path: Path for output Markdown (None for stdout)
        extract_images_dir: Directory to save images (None to skip)
        extract_tables: Whether to extract tables
        use_ocr: Use OCR for scanned PDFs
        dpi: DPI for OCR/image rendering
        page_range: Tuple of (start, end) page numbers
        
    Returns:
        Markdown content string
    """
    pdf_path = os.path.abspath(pdf_path)
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    
    print(f"Processing: {pdf_path}")
    
    # Extract images if requested
    image_refs = []
    if extract_images_dir:
        print(f"Extracting images to: {extract_images_dir}")
        image_refs = extract_images_from_pdf(pdf_path, extract_images_dir)
        print(f"Extracted {len(image_refs)} images")
    
    # Extract text and tables
    if use_ocr:
        print("Using OCR mode...")
        pages = ocr_pdf(pdf_path, dpi=dpi)
    else:
        print("Extracting text and tables...")
        pages = extract_text_and_tables(pdf_path, extract_tables=extract_tables)
    
    # Filter page range if specified
    if page_range:
        start, end = page_range
        pages = [p for p in pages if start <= p['number'] <= end]
        image_refs = [i for i in image_refs if start <= i['page'] <= end]
    
    # Generate markdown
    output_dir = os.path.dirname(output_path) if output_path else None
    markdown = generate_markdown(pdf_path, pages, image_refs, output_dir)
    
    # Output
    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown)
        print(f"Saved: {output_path}")
    else:
        print(markdown)
    
    return markdown


def parse_page_range(range_str):
    """Parse page range string like '1-5' into tuple."""
    if not range_str:
        return None
    
    try:
        if '-' in range_str:
            start, end = range_str.split('-')
            return (int(start), int(end))
        else:
            page = int(range_str)
            return (page, page)
    except ValueError:
        print(f"Error: Invalid page range format: {range_str}")
        print("Use format: START-END (e.g., 1-5)")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Convert PDF to Markdown with support for images and tables",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s document.pdf output.md
  %(prog)s document.pdf output.md --extract-images ./images
  %(prog)s document.pdf output.md --extract-tables
  %(prog)s scanned.pdf output.md --ocr
  %(prog)s document.pdf output.md --page-range 1-5
        """
    )
    
    parser.add_argument('input', help='Input PDF file')
    parser.add_argument('output', nargs='?', help='Output Markdown file (stdout if omitted)')
    parser.add_argument(
        '--extract-images', '-i',
        metavar='DIR',
        help='Extract images to specified directory'
    )
    parser.add_argument(
        '--extract-tables', '-t',
        action='store_true',
        default=True,
        help='Extract tables as Markdown (default: enabled)'
    )
    parser.add_argument(
        '--no-tables',
        action='store_true',
        help='Disable table extraction'
    )
    parser.add_argument(
        '--ocr',
        action='store_true',
        help='Use OCR for scanned/image-based PDFs'
    )
    parser.add_argument(
        '--dpi',
        type=int,
        default=150,
        help='DPI for OCR/image rendering (default: 150)'
    )
    parser.add_argument(
        '--page-range', '-p',
        metavar='RANGE',
        help='Page range to convert (e.g., 1-5)'
    )
    
    args = parser.parse_args()
    
    extract_tables = args.extract_tables and not args.no_tables
    page_range = parse_page_range(args.page_range)
    
    pdf_to_markdown(
        pdf_path=args.input,
        output_path=args.output,
        extract_images_dir=args.extract_images,
        extract_tables=extract_tables,
        use_ocr=args.ocr,
        dpi=args.dpi,
        page_range=page_range
    )


if __name__ == '__main__':
    main()
