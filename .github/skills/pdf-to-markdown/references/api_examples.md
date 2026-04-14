# Python API Examples

### Basic Text Extraction

```python
import pdfplumber

def extract_text(pdf_path):
    """Extract text from PDF, preserving layout."""
    text_content = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text:
                text_content.append(f"## Page {i}\n\n{text}")
    
    return "\n\n---\n\n".join(text_content)
```

### Extract with Tables

```python
import pdfplumber

def extract_with_tables(pdf_path):
    """Extract text and tables from PDF."""
    content = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            content.append(f"## Page {i}\n")
            
            # Extract text
            text = page.extract_text()
            if text:
                content.append(text)
            
            # Extract tables
            tables = page.extract_tables()
            for j, table in enumerate(tables, 1):
                if table:
                    content.append(f"\n### Table {j}\n")
                    content.append(table_to_markdown(table))
    
    return "\n\n".join(content)
```

### Extract Images

```python
import os
from pypdf import PdfReader


def extract_images(pdf_path, output_dir):
    """Extract all images from PDF."""
    os.makedirs(output_dir, exist_ok=True)
    
    reader = PdfReader(pdf_path)
    image_count = 0
    
    for page_num, page in enumerate(reader.pages, 1):
        if '/XObject' in page['/Resources']:
            xobject = page['/Resources']['/XObject'].get_object()
            
            for obj_name in xobject:
                obj = xobject[obj_name]
                if obj['/Subtype'] == '/Image':
                    image_count += 1
                    
                    # Determine format
                    if '/Filter' in obj:
                        filter_type = obj['/Filter']
                        if filter_type == '/DCTDecode':
                            ext = 'jpg'
                        elif filter_type == '/FlateDecode':
                            ext = 'png'
                        else:
                            ext = 'bin'
                    else:
                        ext = 'bin'
                    
                    # Save image
                    filename = f"page{page_num}_img{image_count}.{ext}"
                    filepath = os.path.join(output_dir, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(obj._data)
                    
                    print(f"Saved: {filepath}")
    
    return image_count
```

### OCR for Scanned PDFs

```python
import pytesseract
from pdf2image import convert_from_path


def ocr_pdf(pdf_path):
    """OCR scanned PDF to text."""
    images = convert_from_path(pdf_path, dpi=200)
    text_content = []
    
    for i, image in enumerate(images, 1):
        text = pytesseract.image_to_string(image, lang='eng')
        text_content.append(f"## Page {i}\n\n{text}")
    
    return "\n\n---\n\n".join(text_content)
```
