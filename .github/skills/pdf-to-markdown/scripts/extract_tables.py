#!/usr/bin/env python3
"""
Extract tables from PDF and save as Markdown or CSV.

MIT License
"""

import argparse
import csv
import os
import sys

# Ensure we can import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from utils import table_to_markdown

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber not installed.")
    print("Run: pip install pdfplumber")
    sys.exit(1)


def extract_tables(pdf_path, output_dir, output_format='md'):
    """
    Extract all tables from PDF.
    
    Args:
        pdf_path: Path to input PDF
        output_dir: Directory to save extracted tables
        output_format: 'md' for Markdown, 'csv' for CSV
        
    Returns:
        Number of tables extracted
    """
    os.makedirs(output_dir, exist_ok=True)
    
    table_count = 0
    all_tables_md = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            tables = page.extract_tables()
            
            for table_idx, table in enumerate(tables, 1):
                if not table or len(table) < 1:
                    continue
                
                table_count += 1
                table_id = f"page{page_num}_table{table_idx}"
                
                if output_format == 'csv':
                    # Save as CSV
                    csv_path = os.path.join(output_dir, f"{table_id}.csv")
                    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                        writer = csv.writer(f)
                        for row in table:
                            writer.writerow([cell if cell else "" for cell in row])
                    print(f"Saved: {csv_path}")
                    
                elif output_format == 'md':
                    # Collect for combined Markdown
                    all_tables_md.append(f"## Page {page_num} - Table {table_idx}\n")
                    all_tables_md.append(table_to_markdown(table))
                    all_tables_md.append("")
    
    # Save combined Markdown
    if output_format == 'md' and all_tables_md:
        md_path = os.path.join(output_dir, "tables.md")
        pdf_name = os.path.basename(pdf_path)
        
        content = [f"# Tables from {pdf_name}\n"]
        content.extend(all_tables_md)
        
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(content))
        print(f"Saved: {md_path}")
    
    return table_count


def main():
    parser = argparse.ArgumentParser(
        description="Extract tables from PDF as Markdown or CSV",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s document.pdf ./tables
  %(prog)s document.pdf ./tables --format csv
  %(prog)s document.pdf ./tables --format md
        """
    )
    
    parser.add_argument('input', help='Input PDF file')
    parser.add_argument('output_dir', help='Output directory for tables')
    parser.add_argument(
        '--format', '-f',
        choices=['md', 'csv'],
        default='md',
        help='Output format: md (Markdown) or csv (default: md)'
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: File not found: {args.input}")
        sys.exit(1)
    
    count = extract_tables(
        pdf_path=args.input,
        output_dir=args.output_dir,
        output_format=args.format
    )
    
    print(f"\nExtracted {count} tables from {args.input}")


if __name__ == '__main__':
    main()
