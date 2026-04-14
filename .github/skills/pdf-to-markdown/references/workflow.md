# Workflow Decision Tree

## Simple Text Extraction
Use basic conversion: `python scripts/pdf_to_md.py input.pdf output.md`

## Document with Images
Use image extraction: `--extract-images ./images`

## Document with Tables
Use table extraction: `--extract-tables`

## Scanned PDF / Image-based PDF
Use OCR mode: `--ocr`

## Complex Analysis
1. First convert to images for visual analysis
2. Then run full extraction
