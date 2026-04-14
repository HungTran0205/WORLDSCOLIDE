---
name: tm:pdf-to-markdown
metadata: version: 1.00
description: Convert PDF documents to Markdown format with support for text, images, and tables. Use for document analysis, content extraction, PDF processing for AI agents.
license: MIT
---

# PDF to Markdown Conversion

This skill provides comprehensive tools for converting PDFs to Markdown, including text, images, and tables.

## ⚠️ IMPORTANT: Use Existing Scripts
**DO NOT create new Python scripts for PDF operations.** Always use the existing scripts in the `scripts/` folder:
- `scripts/pdf_to_md.py` - Main PDF to Markdown conversion
- `scripts/convert_pdf_to_images.py` - Extract pages as images
- `scripts/extract_tables.py` - Specialized table extraction

These scripts are production-tested and handle edge cases correctly. Creating new scripts introduces bugs and duplicates functionality.

## Quick Start

```bash
# Basic conversion
python scripts/pdf_to_md.py document.pdf output.md

# Extract with images and tables
python scripts/pdf_to_md.py document.pdf output.md --extract-images ./images --extract-tables

# OCR for scanned PDFs
python scripts/pdf_to_md.py scanned.pdf output.md --ocr
```

## Documentation

- [Workflow Decision Tree](references/workflow.md): Choose the right conversion strategy.
- [Usage Guide](references/usage.md): Detailed CLI usage, options, and output format.
- [Best Practices & Troubleshooting](references/troubleshooting.md): Optimization and fixing common issues.
- [Python API Examples](references/api_examples.md): Code snippets for programmatic use.
- [Advanced Reference](references/advanced.md): Alternative libraries.

## Dependencies

See [requirements.txt](requirements.txt). Install via `pip install -r requirements.txt`.
External dependencies: `tesseract` (for OCR), `poppler` (for pdf2image).

## Scripts

- [pdf_to_md.py](scripts/pdf_to_md.py): Main conversion tool.
- [convert_pdf_to_images.py](scripts/convert_pdf_to_images.py): Extract pages as images.
- [extract_tables.py](scripts/extract_tables.py): Specialized table extraction.
