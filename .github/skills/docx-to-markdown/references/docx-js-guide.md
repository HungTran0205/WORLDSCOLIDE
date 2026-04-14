# docx-js Library Guide

Generate .docx files with JavaScript/TypeScript using the `docx` npm package.

**Read this entire document before starting.** Critical formatting rules are covered throughout.

## Setup

```bash
npm install docx
```

```javascript
const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, PageOrientation, 
  HeadingLevel, BorderStyle, WidthType, UnderlineType, PageBreak
} = require('docx');
const fs = require('fs');

// Create & Save
const doc = new Document({ sections: [{ children: [/* content */] }] });
Packer.toBuffer(doc).then(buffer => fs.writeFileSync("doc.docx", buffer));
```

## Text & Formatting

```javascript
// IMPORTANT: Never use \n for line breaks - use separate Paragraph elements
// ❌ WRONG: new TextRun("Line 1\nLine 2")
// ✅ CORRECT: Multiple Paragraph elements

new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 200 },
  indent: { left: 720, right: 720 },
  children: [
    new TextRun({ text: "Bold", bold: true }),
    new TextRun({ text: "Italic", italics: true }),
    new TextRun({ text: "Underlined", underline: { type: UnderlineType.SINGLE } }),
    new TextRun({ text: "Colored", color: "FF0000", size: 28, font: "Arial" }),
    new TextRun({ text: "Highlighted", highlight: "yellow" }),
    new TextRun({ text: "Strikethrough", strike: true }),
    new TextRun({ text: "x2", superScript: true }),
    new TextRun({ text: "H2O", subScript: true }),
  ]
})
```

## Styles & Headings

```javascript
const doc = new Document({
  styles: {
    default: { 
      document: { run: { font: "Arial", size: 24 } } // 12pt default
    },
    paragraphStyles: [
      { 
        id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: "000000", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER }
      },
      { 
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        run: { size: 32, bold: true, color: "000000", font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 }
      },
      { 
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        run: { size: 28, bold: true, color: "000000", font: "Arial" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 }
      },
    ]
  },
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Document Title")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Section 1")] }),
      new Paragraph({ children: [new TextRun("Normal paragraph text.")] }),
    ]
  }]
});
```

**Font Recommendations:**
- Arial (Headers) + Arial (Body) - Universal, clean
- Times New Roman (Headers) + Arial (Body) - Classic contrast
- Georgia (Headers) + Verdana (Body) - Screen optimized

## Tables

```javascript
new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({ 
          children: [new Paragraph("Header 1")],
          shading: { fill: "CCCCCC" }
        }),
        new TableCell({ 
          children: [new Paragraph("Header 2")],
          shading: { fill: "CCCCCC" }
        }),
      ]
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Cell 1")] }),
        new TableCell({ children: [new Paragraph("Cell 2")] }),
      ]
    }),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE }
})
```

## Lists

```javascript
// Bullet List
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullet-list",
      levels: [{
        level: 0,
        format: "bullet",
        text: "•",
        alignment: AlignmentType.LEFT,
      }]
    }]
  },
  sections: [{
    children: [
      new Paragraph({ 
        text: "First item",
        numbering: { reference: "bullet-list", level: 0 }
      }),
      new Paragraph({ 
        text: "Second item",
        numbering: { reference: "bullet-list", level: 0 }
      }),
    ]
  }]
});

// Numbered List
const doc = new Document({
  numbering: {
    config: [{
      reference: "numbered-list",
      levels: [{
        level: 0,
        format: "decimal",
        text: "%1.",
        alignment: AlignmentType.LEFT,
      }]
    }]
  },
  sections: [{
    children: [
      new Paragraph({ 
        text: "Step one",
        numbering: { reference: "numbered-list", level: 0 }
      }),
      new Paragraph({ 
        text: "Step two",
        numbering: { reference: "numbered-list", level: 0 }
      }),
    ]
  }]
});
```

## Images

```javascript
const imageBuffer = fs.readFileSync("image.png");

new Paragraph({
  children: [
    new ImageRun({
      data: imageBuffer,
      transformation: { width: 200, height: 150 },
      type: "png" // or "jpg", "gif", etc.
    })
  ]
})
```

## Headers & Footers

```javascript
const doc = new Document({
  sections: [{
    headers: {
      default: new Header({
        children: [new Paragraph({ children: [new TextRun("Header Text")] })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun("Page "), new TextRun({ children: ["PAGE_NUMBER"] })]
        })]
      })
    },
    children: [/* document content */]
  }]
});
```

## Page Settings

```javascript
const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: {
          orientation: PageOrientation.PORTRAIT, // or LANDSCAPE
          width: 12240, // 8.5 inches in twips (1 inch = 1440 twips)
          height: 15840 // 11 inches
        },
        margin: {
          top: 1440,    // 1 inch
          right: 1440,
          bottom: 1440,
          left: 1440
        }
      }
    },
    children: [/* content */]
  }]
});
```

## Page Breaks

```javascript
new Paragraph({
  children: [new PageBreak()]
})
```

## Complete Example

```javascript
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } }
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Project Report", bold: true })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Introduction")]
      }),
      new Paragraph({
        children: [
          new TextRun("This document provides an overview of the project. "),
          new TextRun({ text: "Key findings", bold: true }),
          new TextRun(" are highlighted throughout.")
        ]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Conclusion")]
      }),
      new Paragraph({
        children: [new TextRun("The project was completed successfully.")]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("report.docx", buffer);
  console.log("Document created: report.docx");
});
```

## Key Points

1. **Size units**: Text size is in half-points (24 = 12pt), margins in twips (1440 = 1 inch)
2. **No newlines in TextRun**: Use separate Paragraph elements for line breaks
3. **Headings for TOC**: Set `outlineLevel` in styles for Table of Contents support
4. **Style IDs**: Use "Heading1", "Heading2" etc. to override built-in styles
5. **Images need type**: Specify image type ("png", "jpg") in ImageRun
