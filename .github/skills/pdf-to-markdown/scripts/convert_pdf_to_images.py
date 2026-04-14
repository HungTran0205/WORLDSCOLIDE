#!/usr/bin/env python3
"""
Convert PDF pages to PNG images.

Useful for visual analysis of PDF documents before processing.

MIT License
"""

import argparse
import os
import sys

try:
    from pdf2image import convert_from_path
except ImportError:
    print("Error: pdf2image not installed.")
    print("Run: pip install pdf2image")
    print("Also install poppler:")
    print("  - Windows: https://github.com/osber/poppler-windows/releases")
    print("  - macOS: brew install poppler")
    print("  - Linux: apt-get install poppler-utils")
    sys.exit(1)


def convert_pdf_to_images(pdf_path, output_dir, dpi=200, max_dim=None):
    """
    Convert each page of a PDF to a PNG image.
    
    Args:
        pdf_path: Path to input PDF
        output_dir: Directory to save images
        dpi: Resolution for rendering (default: 200)
        max_dim: Maximum dimension (width or height) to scale to
        
    Returns:
        List of saved image paths
    """
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Converting {pdf_path} at {dpi} DPI...")
    images = convert_from_path(pdf_path, dpi=dpi)
    
    saved_paths = []
    
    for i, image in enumerate(images, 1):
        # Scale image if max_dim is specified
        if max_dim:
            width, height = image.size
            if width > max_dim or height > max_dim:
                scale_factor = min(max_dim / width, max_dim / height)
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                image = image.resize((new_width, new_height))
                print(f"  Page {i}: Scaled from {width}x{height} to {new_width}x{new_height}")
        
        image_path = os.path.join(output_dir, f"page_{i}.png")
        image.save(image_path, "PNG")
        saved_paths.append(image_path)
        
        width, height = image.size
        print(f"  Saved: {image_path} ({width}x{height})")
    
    print(f"\nConverted {len(images)} pages to PNG images in {output_dir}")
    return saved_paths


def main():
    parser = argparse.ArgumentParser(
        description="Convert PDF pages to PNG images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s document.pdf ./output_images
  %(prog)s document.pdf ./output_images --dpi 300
  %(prog)s document.pdf ./output_images --max-dim 1500
        """
    )
    
    parser.add_argument('input', help='Input PDF file')
    parser.add_argument('output_dir', help='Output directory for images')
    parser.add_argument(
        '--dpi',
        type=int,
        default=200,
        help='DPI for rendering (default: 200)'
    )
    parser.add_argument(
        '--max-dim',
        type=int,
        help='Maximum dimension (scales proportionally)'
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: File not found: {args.input}")
        sys.exit(1)
    
    convert_pdf_to_images(
        pdf_path=args.input,
        output_dir=args.output_dir,
        dpi=args.dpi,
        max_dim=args.max_dim
    )


if __name__ == '__main__':
    main()
