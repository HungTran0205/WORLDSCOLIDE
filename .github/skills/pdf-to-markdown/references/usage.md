# Usage Guide

## Quick Start commands

```bash
# Basic conversion
python scripts/pdf_to_md.py document.pdf output.md

# Extract images to folder
python scripts/pdf_to_md.py document.pdf output.md --extract-images ./images

# Include tables as markdown
python scripts/pdf_to_md.py document.pdf output.md --extract-tables

# Full extraction (text + images + tables)
python scripts/pdf_to_md.py document.pdf output.md --extract-images ./images --extract-tables

# OCR for scanned PDFs
python scripts/pdf_to_md.py scanned.pdf output.md --ocr
```

## Scripts Details

### pdf_to_md.py - Main Conversion Tool

Converts PDF to Markdown with options for images and tables.

**Usage:**
```bash
python scripts/pdf_to_md.py <input.pdf> [output.md] [options]
```

**Options:**
- `--extract-images <dir>` - Extract images to specified directory
- `--extract-tables` - Convert tables to Markdown format
- `--ocr` - Use OCR for scanned PDFs
- `--dpi <value>` - DPI for image extraction (default: 150)
- `--page-range <start>-<end>` - Convert specific page range

### convert_pdf_to_images.py - PDF to Images

Converts PDF pages to PNG images for visual analysis.

**Usage:**
```bash
python scripts/convert_pdf_to_images.py <input.pdf> <output_dir> [--dpi 200]
```

### extract_tables.py - Table Extraction

Extracts tables from PDF and saves as CSV or Markdown.

**Usage:**
```bash
python scripts/extract_tables.py <input.pdf> <output_dir> [--format md|csv]
```

## Output Format

The generated Markdown follows this structure:

```markdown
# document.pdf

## Page 1

[Extracted text content...]

![Image 1](images/page1_img1.jpg)

### Table 1
| Header 1 | Header 2 | Header 3 |
|---|---|---|
| Data 1 | Data 2 | Data 3 |

---
```
