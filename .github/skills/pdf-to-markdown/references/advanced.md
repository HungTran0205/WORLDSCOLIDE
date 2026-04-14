# PDF Processing Advanced Reference

## Alternative Libraries

### pypdfium2 (Apache/BSD License)

Fast PDF rendering using PDFium (Chromium's PDF library). Great PyMuPDF replacement.

```python
import pypdfium2 as pdfium
from PIL import Image

# Load and render PDF
pdf = pdfium.PdfDocument("document.pdf")

# Render page to image
page = pdf[0]
bitmap = page.render(scale=2.0)
img = bitmap.to_pil()
img.save("page_1.png")

# Extract text
for i, page in enumerate(pdf):
    text = page.get_text()
    print(f"Page {i+1}: {len(text)} chars")
```

### marker-pdf (Apache License)

High-quality PDF to Markdown conversion with ML-based layout detection.

```bash
pip install marker-pdf
marker_single document.pdf output.md
```

### pdf2image + OCR (Various Licenses)

For scanned documents:

```python
from pdf2image import convert_from_path
import pytesseract

images = convert_from_path('scanned.pdf', dpi=300)
for i, img in enumerate(images):
    text = pytesseract.image_to_string(img)
    print(f"Page {i+1}:\n{text}")
```

## Command-Line Tools

### pdftotext (Poppler)

```bash
# Basic extraction
pdftotext input.pdf output.txt

# Preserve layout
pdftotext -layout input.pdf output.txt

# Specific pages
pdftotext -f 1 -l 5 input.pdf output.txt
```

### pdfimages (Poppler)

```bash
# Extract all images
pdfimages -j input.pdf output_prefix
# Creates: output_prefix-000.jpg, output_prefix-001.jpg, etc.
```

### qpdf

```bash
# Merge PDFs
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# Split pages
qpdf input.pdf --pages . 1-5 -- first_five.pdf

# Remove password
qpdf --password=secret --decrypt protected.pdf decrypted.pdf
```

## Handling Complex PDFs

### Multi-column layouts

```python
import pdfplumber

with pdfplumber.open("multicolumn.pdf") as pdf:
    for page in pdf.pages:
        # Get page dimensions
        width = page.width
        
        # Extract left column
        left_bbox = (0, 0, width/2, page.height)
        left_text = page.within_bbox(left_bbox).extract_text()
        
        # Extract right column
        right_bbox = (width/2, 0, width, page.height)
        right_text = page.within_bbox(right_bbox).extract_text()
```

### Complex tables with merged cells

```python
import pdfplumber

with pdfplumber.open("complex_table.pdf") as pdf:
    page = pdf.pages[0]
    
    # Custom table settings
    table = page.extract_table(table_settings={
        "vertical_strategy": "text",
        "horizontal_strategy": "text",
        "snap_tolerance": 3,
        "join_tolerance": 3,
    })
```

### Forms with fillable fields

```python
from pypdf import PdfReader

reader = PdfReader("form.pdf")
fields = reader.get_fields()

for name, field in fields.items():
    print(f"Field: {name}")
    print(f"  Type: {field.get('/FT', 'Unknown')}")
    print(f"  Value: {field.get('/V', 'Empty')}")
```

## Performance Tips

1. **Large PDFs**: Process in page batches
   ```python
   # Process 10 pages at a time
   for start in range(0, total_pages, 10):
       end = min(start + 10, total_pages)
       # Process pages start to end
   ```

2. **Memory management**: Close PDFs explicitly
   ```python
   with pdfplumber.open(path) as pdf:
       # Processing...
   # PDF is automatically closed
   ```

3. **OCR optimization**: Lower DPI for draft, higher for production
   ```python
   # Draft: 150 DPI (faster)
   images = convert_from_path(path, dpi=150)
   
   # Production: 300 DPI (better quality)
   images = convert_from_path(path, dpi=300)
   ```

## Troubleshooting

### No text extracted
- PDF might be scanned → Use OCR
- PDF might be encrypted → Check for password
- Try different extraction method

### Garbled text
- Font encoding issues → Try pypdfium2 instead
- Scanned with artifacts → Preprocess images before OCR

### Tables misaligned
- Adjust extraction settings
- Try different `snap_tolerance` and `join_tolerance` values
- Export as CSV for manual cleanup

### Images not extracting
- Some PDFs use non-standard image formats
- Try rendering pages as images instead
