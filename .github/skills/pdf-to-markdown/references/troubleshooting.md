# Best Practices and Troubleshooting

## Best Practices

1. **For text-heavy documents**: Use basic extraction without OCR
2. **For documents with tables**: Always use `--extract-tables` flag
3. **For image-heavy documents**: Extract images to a folder for reference
4. **For scanned PDFs**: Use OCR mode but verify output accuracy
5. **For large documents**: Process in page ranges to manage memory

## Troubleshooting

### No text extracted
- PDF might be scanned/image-based → Use `--ocr` flag
- PDF might be encrypted → Check if password protected

### Tables not formatted correctly
- Complex merged cells may not extract properly
- Try extracting as CSV for post-processing

### Images not extracting
- Some PDFs embed images in non-standard ways
- Use `convert_pdf_to_images.py` to get page screenshots instead

### OCR quality issues
- Increase DPI: `--dpi 300`
- Ensure tesseract is properly installed
- For non-English text, specify language: configure pytesseract
