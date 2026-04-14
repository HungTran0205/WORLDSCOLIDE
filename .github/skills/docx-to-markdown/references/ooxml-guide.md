# OOXML Editing Guide

Guide for editing existing Word documents (.docx) using Python. Based on Office Open XML (ECMA-376/ISO 29500) specification.

## OOXML Document Structure

A .docx file is a ZIP archive containing:

```
document.docx/
├── [Content_Types].xml      # MIME types for parts
├── _rels/
│   └── .rels               # Package relationships
├── word/
│   ├── document.xml        # Main document content
│   ├── styles.xml          # Style definitions
│   ├── settings.xml        # Document settings
│   ├── fontTable.xml       # Font information
│   ├── comments.xml        # Comments (if any)
│   ├── numbering.xml       # List definitions
│   ├── _rels/
│   │   └── document.xml.rels
│   └── media/              # Images and media
└── docProps/
    ├── core.xml            # Core properties (author, title)
    └── app.xml             # Application properties
```

## Key XML Namespaces

```xml
xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
```

## Common Elements

### Paragraphs and Runs
```xml
<w:p>                           <!-- Paragraph -->
  <w:pPr>                       <!-- Paragraph properties -->
    <w:jc w:val="center"/>      <!-- Justification -->
  </w:pPr>
  <w:r>                         <!-- Run (text container) -->
    <w:rPr>                     <!-- Run properties -->
      <w:b/>                    <!-- Bold -->
      <w:i/>                    <!-- Italic -->
    </w:rPr>
    <w:t>Text content</w:t>     <!-- Text -->
  </w:r>
</w:p>
```

### Tracked Changes
```xml
<!-- Insertion -->
<w:ins w:id="0" w:author="Author" w:date="2026-01-18T10:00:00Z">
  <w:r>
    <w:t>Inserted text</w:t>
  </w:r>
</w:ins>

<!-- Deletion -->
<w:del w:id="1" w:author="Author" w:date="2026-01-18T10:00:00Z">
  <w:r>
    <w:delText>Deleted text</w:delText>
  </w:r>
</w:del>
```

### Comments
```xml
<!-- In document.xml - comment range markers -->
<w:commentRangeStart w:id="0"/>
<w:r><w:t>Commented text</w:t></w:r>
<w:commentRangeEnd w:id="0"/>
<w:r>
  <w:commentReference w:id="0"/>
</w:r>

<!-- In comments.xml -->
<w:comment w:id="0" w:author="Author" w:date="2026-01-18T10:00:00Z" w:initials="A">
  <w:p>
    <w:r><w:t>Comment text</w:t></w:r>
  </w:p>
</w:comment>
```

## DocxEditor Class

Use the provided `DocxEditor` class for editing:

```python
from scripts.docx_editor import DocxEditor

# Initialize
editor = DocxEditor('./unpacked')

# Find elements by various methods
node = editor.get_node("word/document.xml", tag="w:p", line_number=50)
node = editor.get_node("word/document.xml", tag="w:r", contains="specific text")
node = editor.get_node("word/document.xml", tag="w:del", attrs={"w:id": "1"})

# Add tracked insertion
editor.add_insertion(node, "New text to insert", author="Reviewer")

# Add tracked deletion
editor.add_deletion(node, author="Reviewer")

# Add comment
editor.add_comment(
    start_node=node,
    end_node=node, 
    comment_text="This needs review",
    author="Reviewer",
    initials="R"
)

# Save changes
editor.save()
```

## Tracked Change Patterns

### Minimal Edit Principle
Only mark text that actually changes. Break replacements into unchanged + deletion + insertion + unchanged:

```python
# BAD - Replaces entire sentence
'<w:del><w:r><w:delText>The term is 30 days.</w:delText></w:r></w:del>'
'<w:ins><w:r><w:t>The term is 60 days.</w:t></w:r></w:ins>'

# GOOD - Only marks what changed
'<w:r><w:t>The term is </w:t></w:r>'
'<w:del><w:r><w:delText>30</w:delText></w:r></w:del>'
'<w:ins><w:r><w:t>60</w:t></w:r></w:ins>'
'<w:r><w:t> days.</w:t></w:r>'
```

### RSID (Revision Save ID)
RSIDs track editing sessions. Use consistent RSIDs for related changes:

```xml
<w:r w:rsidR="00AB12CD">  <!-- Run's revision ID -->
  <w:t>Text</w:t>
</w:r>
```

Generate random 8-character hex for new sessions:
```python
import random
rsid = ''.join(random.choices('0123456789ABCDEF', k=8))
```

## Manual XML Editing

For complex edits, directly modify the XML:

### Step 1: Locate the target
```bash
# Find text in document.xml
grep -n "target phrase" unpacked/word/document.xml
```

### Step 2: Edit with Python
```python
import defusedxml.minidom as minidom
from pathlib import Path

# Load document
doc_path = Path('./unpacked/word/document.xml')
dom = minidom.parse(str(doc_path))

# Find and modify elements
for elem in dom.getElementsByTagName('w:t'):
    if elem.firstChild and 'old text' in elem.firstChild.data:
        elem.firstChild.data = elem.firstChild.data.replace('old text', 'new text')

# Save with proper formatting
with open(doc_path, 'wb') as f:
    f.write(dom.toxml(encoding='UTF-8'))
```

### Step 3: Validate structure
Ensure all tracked changes have:
- Unique `w:id` attribute
- `w:author` attribute
- `w:date` attribute in ISO 8601 format

## Common Operations

### Replace Text (Simple)
```python
def replace_text(dom, old_text, new_text):
    for elem in dom.getElementsByTagName('w:t'):
        if elem.firstChild and old_text in elem.firstChild.data:
            elem.firstChild.data = elem.firstChild.data.replace(old_text, new_text)
```

### Add Tracked Change (Replace)
```python
def tracked_replace(dom, target_run, old_text, new_text, author, rsid):
    from datetime import datetime, timezone
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Create deletion
    del_elem = dom.createElement('w:del')
    del_elem.setAttribute('w:id', str(get_next_id(dom)))
    del_elem.setAttribute('w:author', author)
    del_elem.setAttribute('w:date', timestamp)
    
    del_run = dom.createElement('w:r')
    del_run.setAttribute('w:rsidDel', rsid)
    del_text = dom.createElement('w:delText')
    del_text.appendChild(dom.createTextNode(old_text))
    del_run.appendChild(del_text)
    del_elem.appendChild(del_run)
    
    # Create insertion
    ins_elem = dom.createElement('w:ins')
    ins_elem.setAttribute('w:id', str(get_next_id(dom)))
    ins_elem.setAttribute('w:author', author)
    ins_elem.setAttribute('w:date', timestamp)
    
    ins_run = dom.createElement('w:r')
    ins_run.setAttribute('w:rsidR', rsid)
    ins_text = dom.createElement('w:t')
    ins_text.appendChild(dom.createTextNode(new_text))
    ins_run.appendChild(ins_text)
    ins_elem.appendChild(ins_run)
    
    # Insert into DOM
    parent = target_run.parentNode
    parent.insertBefore(del_elem, target_run)
    parent.insertBefore(ins_elem, target_run)
    parent.removeChild(target_run)
```

### Get Next Available ID
```python
def get_next_id(dom):
    max_id = -1
    for tag in ('w:ins', 'w:del', 'w:comment', 'w:commentRangeStart'):
        for elem in dom.getElementsByTagName(tag):
            try:
                max_id = max(max_id, int(elem.getAttribute('w:id')))
            except ValueError:
                pass
    return max_id + 1
```

## Validation Checklist

Before packing, verify:

- [ ] All `w:ins` and `w:del` have unique `w:id` values
- [ ] All tracked changes have `w:author` and `w:date`
- [ ] Comment IDs in document.xml match comments.xml
- [ ] No orphaned comment ranges (start without end)
- [ ] XML is well-formed (proper closing tags)
- [ ] Namespaces are declared on root element

## Tips

1. **Always backup**: Copy original before editing
2. **Incremental changes**: Make small changes and test
3. **Use defusedxml**: Prevents XXE attacks
4. **Preserve whitespace**: Use `xml:space="preserve"` on `<w:t>` with spaces
5. **Test in Word**: Open result in Microsoft Word to verify
