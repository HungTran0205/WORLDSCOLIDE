# Test Evidence Document Template Guide

## Overview
This guide provides the standardized template and styling rules for creating test evidence Word documents from Jira test cases.

## Quick Checklist

Before generating any test evidence document, verify:

- [ ] **Color constants defined WITHOUT # symbol** (e.g., "0284C7" not "#0284C7")
- [ ] Document styles configured (Aptos font, Heading1/2 with Ocean Blue)
- [ ] Page margins: 1008 twips (0.7 inches) all sides
- [ ] Test Evidence table with Ocean Blue header (white text, bold)
- [ ] **Borders: NONE for top/left/right/insideVertical, SINGLE for bottom/insideHorizontal (elegant style)**
- [ ] All labels in Test Evidence table are BOLD
- [ ] **NO shading ({ fill: GRAY }) for data row label cells** (only header has shading)
- [ ] **NO verticalAlign property in any table cells** (omit entirely)
- [ ] **Story Details row has width specification (28%/72%)**
- [ ] **Other rows do NOT have width specification**
- [ ] Asymmetric margins for Test Evidence table (150/100 for labels, 100/150 for values)
- [ ] Symmetric margins for data tables (100 all sides)
- [ ] NO spacing property in table cell Paragraphs
- [ ] **Use children: [new TextRun(...)] consistently** (not text: "...")
- [ ] HeadingLevel used for all section headings (not manual styling)
- [ ] Expected results in GREEN (00B050)
- [ ] Test Status: PASSED in green bold
- [ ] **Use EXACT label text from Required Fields list** (do not abbreviate)
- [ ] File naming: `{JIRA_KEY} - Test Evidence.docx`

## File Naming Convention

**Format**: `{JIRA_KEY} - Test Evidence.docx`

**Examples**:
- ✅ `HTM-35258 - Test Evidence.docx`
- ✅ `HTM-34905 - Test Evidence.docx`
- ✅ `HTM-34906 - Test Evidence.docx`
- ❌ `HTM35258-test-evidence.docx` (wrong format)
- ❌ `test-evidence-htm-35258.docx` (wrong order)

## Color Palette Reference

⚠️ **CRITICAL**: Color constants must be defined WITHOUT the `#` symbol.

| Color Name | Hex Code (Display) | Constant Value (Code) | Usage | Visual |
|-----------|----------|----------|-------|--------|
| Ocean Blue | `#0284C7` | `"0284C7"` | Headers, headings, table headers | 🟦 |
| Green | `#00B050` | `"00B050"` | Expected results, PASSED status | 🟩 |
| Gray | `#F3F4F6` | `"F3F4F6"` | Table borders | ⬜ |
| White | `#FFFFFF` | `"FFFFFF"` | Text on blue backgrounds | ⬜ |

**Example - Correct Color Constants:**
```javascript
// ✅ CORRECT - No # symbol
const OCEAN_BLUE = "0284C7";
const GREEN = "00B050";
const GRAY = "F3F4F6";
const WHITE = "FFFFFF";

// ❌ WRONG - Has # symbol
const OCEAN_BLUE = "#0284C7";  // Will cause rendering issues
```

## Document Structure Decision Flow

**When to include "II. Test Data" section:**

```
Has multiple test scenarios with test data variations?
├─ YES → Include "II. Test Data" with TD-01, TD-02, TD-03...
│         Each step references TD-XX with individual tables
│         Example: HTM-34906 (3 scenarios), HTM-34905 (6 scenarios)
│
└─ NO → Skip "II. Test Data" section
         Direct steps with expected results only
         Example: HTM-35258 (2 simple verification steps)
```

**Document Structure:**
1. Test Evidence Table (Header with 10 fields)
2. I. Purpose (with Preconditions if applicable)
3. II. Test Data (optional - only if multiple test scenarios)
4. III. Test Steps & Expected Results

---

## Document Setup

### Page Margins
**⚠️ CRITICAL**: Always set page margins in section properties.

```javascript
sections: [{
  properties: {
    page: {
      margin: {
        top: 1008,     // 0.7 inches
        right: 1008,   // 0.7 inches
        bottom: 1008,  // 0.7 inches
        left: 1008     // 0.7 inches
      }
    }
  },
  children: [...]
}]
```

**Note**: 1008 twips = 0.7 inches. This is the standard margin for all test evidence documents.

### Document Styles Configuration
**⚠️ CRITICAL**: Always define document styles instead of hardcoding font/size in every TextRun.

```javascript
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: "Aptos",
          size: 22  // 11pt default
        }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: {
          size: 32,
          bold: true,
          color: "0284C7",
          font: "Aptos"
        },
        paragraph: {
          spacing: { before: 600, after: 200 }
        }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: {
          size: 28,
          bold: true,
          color: "0284C7",
          font: "Aptos"
        },
        paragraph: {
          spacing: { before: 300, after: 100 }
        }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: 1008,
          right: 1008,
          bottom: 1008,
          left: 1008
        }
      }
    },
    children: [...]
  }]
});
```

---

## Document Structure

### 1. Test Evidence Table (Header)

- **Format**: 2-column table (Label | Value)
- **Column Widths**: 
  - Column 1 (Labels): 28% - `width: { size: 28, type: WidthType.PERCENTAGE }`
  - Column 2 (Values): 72% - `width: { size: 72, type: WidthType.PERCENTAGE }`
- **⚠️ CRITICAL - Width Specification Rule**:
  - **Header row**: Has `width: { size: 28 }` + `columnSpan: 2`
  - **Story Details row ONLY**: MUST specify width on BOTH cells (28% and 72%)
  - **All other data rows**: Do NOT specify width (let table auto-size)
- **Header Row**: Ocean Blue background (#0284C7), white text "Test Evidence" with columnSpan: 2
- **⚠️ CRITICAL - Borders** (elegant style - no box borders):
  - `top: { style: BorderStyle.NONE }`
  - `bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY }`
  - `left: { style: BorderStyle.NONE }`
  - `right: { style: BorderStyle.NONE }`
  - `insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: GRAY }`
  - `insideVertical: { style: BorderStyle.NONE }`
- **⚠️ Labels Styling**: All label cells (column 1) MUST be **BOLD**
- **⚠️ CRITICAL - NO Shading for Data Rows**: Do NOT add `shading: { fill: GRAY }` to label cells. Only header row has shading.
- **⚠️ CRITICAL - NO verticalAlign**: Do NOT add `verticalAlign: VerticalAlign.CENTER` to any cells. Omit this property entirely.
- **⚠️ Cell Margins** (asymmetric pattern - essential for professional layout):
  - Header row: `{ top: 120, bottom: 120, left: 150, right: 100 }`
  - Label cells (column 1): `{ top: 80, bottom: 80, left: 150, right: 100 }`
  - Value cells (column 2): `{ top: 80, bottom: 80, left: 100, right: 150 }` (flipped)
- **⚠️ NO spacing in Paragraphs**: Do NOT add `spacing: { before: X, after: Y }` to Paragraph in table cells

#### Required Fields (in order):

⚠️ **CRITICAL**: Use EXACT label text below. Do NOT abbreviate or modify.

1. **Story Details**: `{LINKED_TICKET_KEY} - {LINKED_TICKET_SUMMARY}` 
   - Label text: `"Story Details"` (no colon)
   - ⚠️ **IMPORTANT**: Use the ticket that has "Is testing" relationship (outward link), NOT the test ticket itself
   - ⚠️ **IMPORTANT**: This row MUST have width specification (28%/72%)
   - Example: Test ticket HTM-34776 → Linked ticket HTM-34726 → Value: "HTM-34726 - Optimise Equifax address lookup calls for Tesco Mobile address search"

2. **Release Version / Sprint**: `{FIX_VERSION}`
   - Label text: `"Release Version / Sprint"` (EXACT - not "Release")
   - Example: "Release 26.3"

3. **Client Reference**: `N/A` (default)
   - Label text: `"Client Reference"`

4. **Test Start Date**: `DD/MMM/YYYY`
   - Label text: `"Test Start Date"`
   - Example: "10/Mar/2026"

5. **Test End Date**: `DD/MMM/YYYY`
   - Label text: `"Test End Date"`
   - Example: "10/Mar/2026"

6. **Assignee**: `{ASSIGNEE_NAME}`
   - Label text: `"Assignee"`
   - Example: "Lucas Tran"

7. **Test Environment**: `SYSTEST 3` (default)
   - Label text: `"Test Environment"`

8. **Test Status**: **PASSED** (green bold #00B050)
   - Label text: `"Test Status"`

9. **Test Description**: `{JIRA_SUMMARY}` 
   - Label text: `"Test Description"`
   - Use Jira ticket summary/title, NOT description field
   - Example: "HTM-35258 - Credit Check Data Mapping - TransUnion"

**Example - Test Evidence Table Data Row:**
```javascript
new TableRow({
  children: [
    new TableCell({ 
      children: [
        new Paragraph({ 
          children: [new TextRun({ text: "Assignee", bold: true })]  // ✅ BOLD label, use TextRun
        })
      ],
      // ⚠️ NO shading property (only header has shading)
      // ⚠️ NO verticalAlign property (omit entirely)
      margins: { top: 80, bottom: 80, left: 150, right: 100 }  // ✅ Asymmetric margins
    }),
    new TableCell({ 
      children: [
        new Paragraph({ 
          children: [new TextRun("Lucas Tran")]  // ✅ Consistent TextRun pattern
          // ⚠️ NO spacing property in table cell Paragraphs
        })
      ],
      margins: { top: 80, bottom: 80, left: 100, right: 150 }  // ✅ Flipped margins
    }),
  ]
}),
```

### 2. Content Sections (No Heading 1)

**⚠️ IMPORTANT**: Do NOT include "Test Evidence" as Heading 1. Start directly with "I. Purpose".

#### Section I: Purpose
- **Heading 2**: "I. Purpose"
- **No colon at the end**

```javascript
new Paragraph({
  text: "I. Purpose",
  heading: HeadingLevel.HEADING_2  // ✅ Uses document styles
})
```

- **Content**: Brief description of test objective (uses default document font/size)
- **Preconditions** (optional): If test requires specific setup, add bold "Preconditions:" label with bullet points
  - Indent: `indent: { left: 300 }` for single dash bullets

**Example with Preconditions:**
```javascript
new Paragraph({
  text: "I. Purpose",
  heading: HeadingLevel.HEADING_2
}),

new Paragraph({
  children: [new TextRun('Verify "Credit Check Data Mapping – TransUnion" table is created...')],
  spacing: { after: 200 }
}),

new Paragraph({
  children: [new TextRun({ text: "Preconditions:", bold: true })],
  spacing: { after: 100 }
}),

new Paragraph({
  children: [new TextRun('- Spreadsheet v0.7.3 "HSN Config Table" available for reference')],
  spacing: { after: 300 },
  indent: { left: 300 }
})
```

#### Section II: Test Data (Optional)

**⚠️ Only include this section when:**
- Test has multiple test scenarios with different data
- Test data requires reference during test steps (TD-01, TD-02, TD-03...)
- Multiple variations need to be tested

**⚠️ Skip this section when:**
- Test is simple verification without data variations
- No test data table is needed (like HTM-35258)

- **Heading 2**: "II. Test Data"
- **No colon at the end**

```javascript
new Paragraph({
  text: "II. Test Data",
  heading: HeadingLevel.HEADING_2
})
```

- **Table Format**: 
  - Ocean Blue header row (#0284C7) with white text, bold
  - Gray borders on all sides (#F3F4F6)
  - **Cell margins**: `top: 80, bottom: 80, left: 100, right: 100` (symmetric, all sides)
  - **⚠️ NO spacing in Paragraphs**: Table cells must NOT have `spacing` property
  - Columns: Test ID, Scenario, Order Type, Channel, Product, MPN, SIM Type, SSN, SIM Distributor, SIM Requested, Netcracker Update (adjust per test case)
  - Data rows: TD-01, TD-02, TD-03, etc.

**Example - Test Data Table Cell:**
```javascript
new TableCell({
  children: [
    new Paragraph({
      children: [new TextRun("TD-01")]  // ✅ Simplified TextRun, NO spacing property
    })
  ],
  margins: { top: 80, bottom: 80, left: 100, right: 100 }  // ✅ Symmetric
})
```

#### Section III: Test Steps & Expected Results
- **Heading 2**: "III. Test Steps & Expected Results"
- **No colon at the end**

```javascript
new Paragraph({
  text: "III. Test Steps & Expected Results",
  heading: HeadingLevel.HEADING_2
})
```

- **Format**:
  - Step header: `Step N. ` (bold) + description
  - Test Data reference (if applicable): `TD-0X:` (bold)
  - Individual test data table for each TD with same styling as main table
  - **⚠️ CRITICAL - Test Data Tables in Steps**: Table headers MUST have Ocean Blue background (#0284C7) with white text and bold
  - Expected results: Green text (#00B050) with "==> As expected, " prefix (note comma, not colon)

**Example - Step with Expected Results:**
```javascript
// Step heading
new Paragraph({
  children: [
    new TextRun({ text: "Step 1. ", bold: true }),  // ✅ Bold step number
    new TextRun("Navigate to HUB → Reference Data → Credit Check Data Mapping...")  // ✅ Simplified
  ],
  spacing: { after: 100 }  // ✅ Spacing allowed for steps (not table cells)
}),

// Expected result (inline format)
new Paragraph({
  children: [
    new TextRun({ text: "==> As expected, ", color: GREEN }),  // ✅ Comma, not colon
    new TextRun({ text: 'the table "Credit Check Data Mapping – TransUnion" exists with...', color: GREEN })
  ]
}),

new Paragraph({
  children: [new TextRun("")],
  spacing: { after: 200 }  // Empty paragraph for spacing
}),
```

**Example - Multi-line Expected Results with Bullets:**

⚠️ **CRITICAL - Bullet Formatting**: 
- Do NOT use `bullet: { level: 0 }` or `bullet: { level: 1 }` - these render incorrectly
- Instead, use dashes (`-`) and asterisks (`*`) in the text with proper indentation

**Level 1 bullets** (dash `-`):
```javascript
new Paragraph({
  children: [new TextRun({ text: "- First level item", color: GREEN })],
  indent: { left: 300 },
  spacing: { before: 50, after: 50 }
})
```

**Level 2 bullets** (asterisk `*`):
```javascript
new Paragraph({
  children: [new TextRun({ text: "* Second level item", color: GREEN })],
  indent: { left: 600 },
  spacing: { before: 50, after: 50 }
})
```

**Complete Multi-Level Example:**
```javascript
// Expected result header
new Paragraph({
  children: [new TextRun({ text: "==> As expected,", color: GREEN })],
  spacing: { before: 100, after: 50 }
}),

// Level 1 bullet
new Paragraph({
  children: [new TextRun({ text: "- All 7 properties are visible with correct field types:", color: GREEN })],
  spacing: { before: 50, after: 50 },
  indent: { left: 300 }
}),

// Level 2 bullets (nested under level 1)
new Paragraph({
  children: [new TextRun({ text: "* Credit Check Provider (dropdown)", color: GREEN })],
  spacing: { before: 50, after: 50 },
  indent: { left: 600 }
}),

new Paragraph({
  children: [new TextRun({ text: "* TransUnion Authentication URL (string)", color: GREEN })],
  spacing: { before: 50, after: 50 },
  indent: { left: 600 }
}),

// Another level 1 bullet
new Paragraph({
  children: [new TextRun({ text: "- All properties are marked as mandatory and updateable", color: GREEN })],
  spacing: { before: 50, after: 50 },
  indent: { left: 300 }
}),

// Another level 1 bullet (last one)
new Paragraph({
  children: [new TextRun({ text: "- Credit Check Provider dropdown contains values: Equifax and TransUnion", color: GREEN })],
  spacing: { before: 50, after: 200 },  // Note: after: 200 for last bullet
  indent: { left: 300 }
})
```

**Example - Test Data Table in Steps (TD-01, TD-02, etc.):**
```javascript
// TD-01 label
new Paragraph({
  children: [new TextRun({ text: "TD-01:", bold: true })],
  spacing: { before: 100, after: 50 }
}),

// TD-01 test data table
new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.SINGLE, size: 6, color: GRAY },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: GRAY },
    left: { style: BorderStyle.SINGLE, size: 6, color: GRAY },
    right: { style: BorderStyle.SINGLE, size: 6, color: GRAY },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: GRAY },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: GRAY }
  },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Order Type", color: WHITE, bold: true })] })],
          shading: { fill: OCEAN_BLUE },  // ✅ CRITICAL: Ocean Blue background
          margins: { top: 80, bottom: 80, left: 100, right: 100 }
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Channel", color: WHITE, bold: true })] })],
          shading: { fill: OCEAN_BLUE },  // ✅ CRITICAL: Ocean Blue background
          margins: { top: 80, bottom: 80, left: 100, right: 100 }
        }),
        // ... more header cells with Ocean Blue background
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun("NEW - New customer")] })],
          margins: { top: 80, bottom: 80, left: 100, right: 100 }
        }),
        // ... data cells
      ]
    })
  ]
})
```

---

## Styling Rules

### Colors
- **Ocean Blue**: `#0284C7` - Headers, headings, table headers
- **Green**: `#00B050` - PASSED status, expected results text
- **Gray**: `#F3F4F6` - Table borders
- **White**: `#FFFFFF` - Text on blue backgrounds

### Font
- **Family**: Aptos (all text)
- **Default Size**: 22 (11pt)
- **Heading 1**: 32 (16pt) - NOT USED (no "Test Evidence" heading)
- **Heading 2**: 28 (14pt) - Used for I. Purpose, II. Test Data, III. Test Steps

**⚠️ CRITICAL - Font Consistency:**

**IMPORTANT:** With document styles configured, you DON'T need to specify `font: "Aptos"` and `size: 22` in every TextRun. The document default handles this automatically.

```javascript
// ✅ CORRECT - Simplified, uses document default styles
new Paragraph({
  children: [new TextRun("Some text")]  // Automatically uses Aptos, size 22
})

// ✅ CORRECT - With properties
new Paragraph({
  children: [
    new TextRun({ text: "Bold text", bold: true })  // Aptos 22 + bold
  ]
})

// ✅ CORRECT - Colored text
new Paragraph({
  children: [
    new TextRun({ text: "==> As expected", color: GREEN })  // Aptos 22 + green
  ]
})

// ❌ WRONG - Shorthand text property (doesn't work with children)
new Paragraph({ 
  text: "Some text",  // This creates plain text without TextRun wrapper
  spacing: { after: 100 }
})

// ❌ WRONG - Over-specifying (redundant with document styles)
new Paragraph({
  children: [
    new TextRun({
      text: "Some text",
      size: 22,  // ❌ Redundant
      font: "Aptos",  // ❌ Redundant
    })
  ]
})
```

**RULE: Use simplified `new TextRun("text")` or `new TextRun({ text: "...", bold/color })`. Only add font/size if overriding document defaults.**

### Margins & Spacing
- **Page Margins**: 0.7 inches all sides (1008 twips)
- **Table Cell Padding**: 
  - **Test Evidence Table** (ASYMMETRIC):
    - Header row: `top: 120, bottom: 120, left: 150/100, right: 100/150` (flipped for column 2)
    - Data rows: `top: 80, bottom: 80, left: 150/100, right: 100/150` (flipped for column 2)
  - **Data Tables** (Test Data, TD-01/02/03) (SYMMETRIC): 
    - All cells: `top: 80, bottom: 80, left: 100, right: 100`
- **Paragraph Spacing**:
  - **⚠️ CRITICAL**: NO spacing in table cell Paragraphs (`spacing: { before/after }` property must be OMITTED)
  - After headings: Handled by document styles (Heading2: before 300, after 100)
  - After steps: 100-200
  - Between bullet points: 50-100
  - Before expected results: 100-200

### Indentation for Bullet Points
- **Single dash** `"- "`: `indent: { left: 300 }`
- **Double dash** `"  - "`: `indent: { left: 600 }`

### Table Borders
- **Test Evidence Table**: 
  - Bottom border only: gray (#F3F4F6), size 1
  - Inside horizontal: gray, size 1
  - No top, left, right, inside vertical
  
- **Data Tables** (Test Data, TD-01/02/03):
  - All borders: gray (#F3F4F6)
  - Size: 6 for outer, 1 for inside

---

## Common Mistakes to Avoid

### ❌ MISTAKE 1: Spacing in Table Cells
```javascript
// ❌ WRONG
new TableCell({
  children: [
    new Paragraph({
      children: [new TextRun("Text")],
      spacing: { after: 100 }  // ❌ Never in table cells!
    })
  ]
})

// ✅ CORRECT
new TableCell({
  children: [
    new Paragraph({
      children: [new TextRun("Text")]  // No spacing property
    })
  ]
})
```

### ❌ MISTAKE 2: Manual Heading Styling
```javascript
// ❌ WRONG
new Paragraph({
  children: [
    new TextRun({ 
      text: "I. Purpose", 
      size: 28, 
      bold: true, 
      color: OCEAN_BLUE 
    })
  ]
})

// ✅ CORRECT
new Paragraph({
  text: "I. Purpose",
  heading: HeadingLevel.HEADING_2  // Uses document styles
})
```

### ❌ MISTAKE 3: Forgetting Ocean Blue Background in TD Tables
```javascript
// ❌ WRONG - Just bold, no background
new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text: "Order Type", bold: true })] })]
})

// ✅ CORRECT - Ocean Blue background with white text
new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text: "Order Type", color: WHITE, bold: true })] })],
  shading: { fill: OCEAN_BLUE }
})
```

### ❌ MISTAKE 4: Not Bold Labels in Test Evidence Table
```javascript
// ❌ WRONG
new TableCell({
  children: [new Paragraph({ children: [new TextRun("Assignee")] })]  // Not bold
})

// ✅ CORRECT
new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text: "Assignee", bold: true })] })]
})
```

### ❌ MISTAKE 5: Wrong Margin Configuration
```javascript
// ❌ WRONG - Using symmetric margins for Test Evidence table
margins: { top: 80, bottom: 80, left: 100, right: 100 }

// ✅ CORRECT - Asymmetric margins for Test Evidence table
// Column 1:
margins: { top: 80, bottom: 80, left: 150, right: 100 }
// Column 2:
margins: { top: 80, bottom: 80, left: 100, right: 150 }
```

### ❌ MISTAKE 6: Including "Test Evidence" Heading 1
```javascript
// ❌ WRONG
new Paragraph({
  text: "Test Evidence",
  heading: HeadingLevel.HEADING_1
}),

new Paragraph({
  text: "I. Purpose",
  heading: HeadingLevel.HEADING_2
})

// ✅ CORRECT - No Heading 1, start with I. Purpose
new Paragraph({
  text: "I. Purpose",
  heading: HeadingLevel.HEADING_2
})
```

### ❌ MISTAKE 7: Using Colons in Section Headings
```javascript
// ❌ WRONG
new Paragraph({
  text: "I. Purpose:",  // Has colon
  heading: HeadingLevel.HEADING_2
})

// ✅ CORRECT
new Paragraph({
  text: "I. Purpose",  // No colon
  heading: HeadingLevel.HEADING_2
})
```

### ❌ MISTAKE 8: Missing Required Field (Client Reference)
```javascript
// ❌ WRONG - Only 8 fields (missing Client Reference)
rows: [
  // Header
  // Story Details
  // Release Version / Sprint
  // Test Start Date  ← Missing Client Reference here!
  // ...
]

// ✅ CORRECT - All 9 fields present
rows: [
  // Header
  // Story Details
  // Release Version / Sprint
  // Client Reference  ← Must include
  // Test Start Date
  // Test End Date
  // Assignee
  // Test Environment
  // Test Status
  // Test Description
]
```

### ❌ MISTAKE 9: Abbreviated or Modified Label Text
```javascript
// ❌ WRONG
new TextRun({ text: "Release", bold: true })  // Abbreviated

// ✅ CORRECT - Use EXACT text from Required Fields list
new TextRun({ text: "Release Version / Sprint", bold: true })
```

### ❌ MISTAKE 10: Width Specification on Wrong Rows
```javascript
// ❌ WRONG - Width on all rows
new TableRow({
  children: [
    new TableCell({
      children: [...],
      width: { size: 28, type: WidthType.PERCENTAGE }  // ❌ Don't add to Release row
    }),
    // ...
  ]
})

// ✅ CORRECT - Width ONLY on Story Details row
// Header row
new TableRow({
  children: [
    new TableCell({
      width: { size: 28, type: WidthType.PERCENTAGE },
      columnSpan: 2
    })
  ]
}),
// Story Details row - ONLY row with width
new TableRow({
  children: [
    new TableCell({
      width: { size: 28, type: WidthType.PERCENTAGE }  // ✅ Width here
    }),
    new TableCell({
      width: { size: 72, type: WidthType.PERCENTAGE }  // ✅ Width here
    })
  ]
}),
// Release row - NO width
new TableRow({
  children: [
    new TableCell({
      // NO width specification
    }),
    new TableCell({
      // NO width specification
    })
  ]
})
```

### ❌ MISTAKE 11: Using bullet: { level } for Multi-Level Bullets
```javascript
// ❌ WRONG - bullet property renders incorrectly
new Paragraph({
  children: [new TextRun({ text: "Item", color: GREEN })],
  bullet: { level: 0 }  // ❌ Doesn't work as expected
})

// ✅ CORRECT - Use dashes and asterisks in text with indent
new Paragraph({
  children: [new TextRun({ text: "- Level 1 item", color: GREEN })],
  indent: { left: 300 }
})

new Paragraph({
  children: [new TextRun({ text: "* Level 2 item", color: GREEN })],
  indent: { left: 600 }
})
```

### ❌ MISTAKE 12: Adding Shading to Label Cells in Test Evidence Table
```javascript
// ❌ WRONG - Gray background on label cells
new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text: "Assignee", bold: true })] })],
  shading: { fill: GRAY },  // ❌ Do NOT add this to data rows
  margins: { top: 80, bottom: 80, left: 150, right: 100 }
})

// ✅ CORRECT - No shading for data rows
new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text: "Assignee", bold: true })] })],
  // NO shading property
  margins: { top: 80, bottom: 80, left: 150, right: 100 }
})
```

**Note**: Only the header row ("Test Evidence") should have `shading: { fill: OCEAN_BLUE }`. All data rows are clean without any background color.

### ❌ MISTAKE 13: Adding verticalAlign to Table Cells
```javascript
// ❌ WRONG - Unnecessary verticalAlign property
new TableCell({
  children: [...],
  verticalAlign: VerticalAlign.CENTER,  // ❌ Do NOT add this
  margins: { top: 80, bottom: 80, left: 150, right: 100 }
})

// ✅ CORRECT - Omit verticalAlign entirely
new TableCell({
  children: [...],
  // NO verticalAlign property
  margins: { top: 80, bottom: 80, left: 150, right: 100 }
})
```

**Note**: The docx library handles vertical alignment automatically. Adding this property is unnecessary and may cause inconsistent rendering.

### ❌ MISTAKE 14: Using text: "..." Instead of children: [new TextRun(...)]
```javascript
// ❌ INCONSISTENT - Mixed patterns
new Paragraph({
  text: "Simple text",  // Works but inconsistent
  bold: true
})

// ✅ CORRECT - Consistent TextRun pattern
new Paragraph({
  children: [
    new TextRun({
      text: "Simple text",
      bold: true
    })
  ]
})
```

**Note**: Always use `children: [new TextRun(...)]` pattern for consistency, especially when you need formatting (bold, color, etc.).

---

## Troubleshooting

### Error: EBUSY - resource busy or locked
**Symptom**: Cannot write to .docx file
```
Error: EBUSY: resource busy or locked, open 'HTM-35258 - Test Evidence.docx'
```

**Cause**: Document is open in Microsoft Word

**Solution**: Close the .docx file in Word before regenerating

---

### Issue: Headings Not Styled Correctly
**Symptom**: Headings appear in default black color instead of Ocean Blue

**Cause**: Using manual TextRun styling instead of HeadingLevel

**Solution**: 
```javascript
// ❌ WRONG
new Paragraph({
  children: [new TextRun({ text: "I. Purpose", bold: true, color: OCEAN_BLUE, size: 28 })]
})

// ✅ CORRECT
new Paragraph({
  text: "I. Purpose",
  heading: HeadingLevel.HEADING_2
})
```

---

### Issue: Table Cells Have Extra Spacing
**Symptom**: Unexpected gaps between table rows

**Cause**: Added `spacing: { before/after }` to Paragraph in table cell

**Solution**: Remove spacing property from all table cell Paragraphs
```javascript
// ❌ WRONG
new TableCell({
  children: [
    new Paragraph({
      children: [new TextRun("Text")],
      spacing: { after: 100 }  // ❌ This causes extra spacing
    })
  ]
})

// ✅ CORRECT
new TableCell({
  children: [
    new Paragraph({
      children: [new TextRun("Text")]  // No spacing
    })
  ]
})
```

---

### Issue: Test Data Table Headers Not Blue
**Symptom**: TD-01, TD-02 tables have plain headers

**Cause**: Forgot to add `shading: { fill: OCEAN_BLUE }` and white text color

**Solution**:
```javascript
new TableCell({
  children: [new Paragraph({ children: [new TextRun({ text: "Order Type", color: WHITE, bold: true })] })],
  shading: { fill: OCEAN_BLUE },  // ✅ Must add this
  margins: { top: 80, bottom: 80, left: 100, right: 100 }
})
```

---

### Issue: Document Margins Not Applied
**Symptom**: Document has default margins instead of 0.7 inches

**Cause**: Forgot to set page margins in section properties

**Solution**: Always include margin configuration in section properties
```javascript
sections: [{
  properties: {
    page: {
      margin: {
        top: 1008,
        right: 1008,
        bottom: 1008,
        left: 1008
      }
    }
  },
  children: [...]
}]
```

---

## Document Generation Workflow

1. **Fetch Jira Issue Data**:
   ```javascript
   mcp_atlassian_atl_getAccessibleAtlassianResources()
   mcp_atlassian_atl_getJiraIssue(cloudId, issueIdOrKey, expand: "issuelinks")
   ```

2. **Extract Linked Ticket** (for Story Details):
   - Find the issue link with type "Is testing" (outward relationship)
   - Extract `outwardIssue.key` and `outwardIssue.fields.summary`
   - Use this for Story Details value instead of the test ticket itself

3. **Parse Test Data from Description**:
   - Extract Purpose section
   - Check if test requires "II. Test Data" section (multiple scenarios?)
   - Parse Test Data table if present (TD-01, TD-02, TD-03, etc.)
   - Extract Test Steps and Expected Results

4. **Create Word Document**:
   - Use `docx` npm package
   - Apply document styles in config
   - Build Test Evidence table with 10 fields
   - Add I. Purpose section
   - Add II. Test Data section (if applicable)
   - Add III. Test Steps & Expected Results
   - Generate test data tables for each TD-XX
   - Format expected results in green

5. **Generate File**:
   ```javascript
   Packer.toBuffer(doc).then(buffer => {
     fs.writeFileSync("{JIRA_KEY} - Test Evidence.docx", buffer);
   });
   ```

---

## Complete Minimal Example

Below is a complete working example showing the critical elements:

```javascript
const fs = require('fs');
const { 
    Document, 
    Paragraph, 
    TextRun, 
    Table, 
    TableCell, 
    TableRow, 
    WidthType, 
    BorderStyle,
    HeadingLevel,
    Packer
} = require('docx');

// Color constants
const OCEAN_BLUE = "0284C7";
const GREEN = "00B050";
const GRAY = "F3F4F6";
const WHITE = "FFFFFF";

const doc = new Document({
    styles: {
        default: {
            document: {
                run: {
                    font: "Aptos",
                    size: 22 // 11pt default
                }
            }
        },
        paragraphStyles: [
            {
                id: "Heading2",
                name: "Heading 2",
                basedOn: "Normal",
                next: "Normal",
                run: {
                    font: "Aptos",
                    size: 28, // 14pt
                    bold: true,
                    color: OCEAN_BLUE
                },
                paragraph: {
                    spacing: { before: 300, after: 100 }
                }
            }
        ]
    },
    sections: [{
        properties: {
            page: {
                margin: {
                    top: 1008,
                    right: 1008,
                    bottom: 1008,
                    left: 1008
                }
            }
        },
        children: [
            // Test Evidence Table
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: GRAY },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: GRAY },
                    insideVertical: { style: BorderStyle.NONE }
                },
                rows: [
                    // Header row
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Test Evidence", color: WHITE, bold: true })] })],
                                shading: { fill: OCEAN_BLUE },
                                margins: { top: 120, bottom: 120, left: 150, right: 100 },
                                width: { size: 28, type: WidthType.PERCENTAGE },
                                columnSpan: 2
                            })
                        ]
                    }),
                    // Story Details row (ONLY row with width specification)
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Story Details", bold: true })] })],
                                margins: { top: 80, bottom: 80, left: 150, right: 100 },
                                width: { size: 28, type: WidthType.PERCENTAGE }  // ⚠️ CRITICAL
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun("HTM-12345 - Story Name")] })],
                                margins: { top: 80, bottom: 80, left: 100, right: 150 },
                                width: { size: 72, type: WidthType.PERCENTAGE }  // ⚠️ CRITICAL
                            })
                        ]
                    }),
                    // Release Version / Sprint row (NO width specification)
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Release Version / Sprint", bold: true })] })],
                                margins: { top: 80, bottom: 80, left: 150, right: 100 }
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun("Release 26.3")] })],
                                margins: { top: 80, bottom: 80, left: 100, right: 150 }
                            })
                        ]
                    }),
                    // ... other rows (Client Reference, Test Start Date, Test End Date, Assignee, Test Environment, Test Status, Test Description)
                ]
            }),

            // I. Purpose
            new Paragraph({
                text: "I. Purpose",
                heading: HeadingLevel.HEADING_2
            }),

            new Paragraph({
                children: [new TextRun("To verify something...")],
                spacing: { after: 200 }
            }),

            // III. Test Steps & Expected Results
            new Paragraph({
                text: "III. Test Steps & Expected Results",
                heading: HeadingLevel.HEADING_2
            }),

            // Step 1
            new Paragraph({
                children: [
                    new TextRun({ text: "Step 1. ", bold: true }),
                    new TextRun("Navigate and verify...")
                ],
                spacing: { after: 100 }
            }),

            // Expected result with multi-level bullets
            new Paragraph({
                children: [new TextRun({ text: "==> As expected,", color: GREEN })],
                spacing: { before: 100, after: 50 }
            }),

            new Paragraph({
                children: [new TextRun({ text: "- Item visible with correct format:", color: GREEN })],
                spacing: { before: 50, after: 50 },
                indent: { left: 300 }
            }),

            new Paragraph({
                children: [new TextRun({ text: "* Sub-item 1 (detail)", color: GREEN })],
                spacing: { before: 50, after: 50 },
                indent: { left: 600 }
            }),

            new Paragraph({
                children: [new TextRun({ text: "* Sub-item 2 (detail)", color: GREEN })],
                spacing: { before: 50, after: 200 },
                indent: { left: 600 }
            })
        ]
    }]
});

// Write document
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("HTM-12345 - Test Evidence.docx", buffer);
});
```

---

## Important Notes Summary

### ❌ DO NOT:
- Include a "Conclusion" section at the end
- Add `spacing: { before/after }` to Paragraphs inside table cells
- Manually style headings - use `heading: HeadingLevel.HEADING_2`
- Over-specify font/size in TextRun when document styles are defined
- Forget to set page margins in section properties
- Forget to add Ocean Blue background with white text to table headers in Test Steps section
- Include "Test Evidence" as Heading 1
- Add colons to section headings ("I. Purpose:" → "I. Purpose")
- Use "Story Details" as table header (use "Test Evidence" instead)

### ✅ ALWAYS:
- Configure document styles at the top level (default font + paragraph styles)
- Set page margins to 1008 twips (0.7 inches) on all sides in section properties
- Use **Ocean Blue (#0284C7)** for all headers and headings (via document styles)
- Use **Green (#00B050)** for all expected results and PASSED status
- Use **Aptos font** throughout the document (via document default styles)
- Make labels in Test Evidence table BOLD
- Apply Ocean Blue background (#0284C7) with white text and bold to table headers in Test Steps section
- Keep indentation consistent: 300 for single dash, 600 for double dash
- Format all expected results in green color
- Use subtle gray (#F3F4F6) for table borders
- Use **asymmetric margins** for Test Evidence table (150/100 flipped)
- Use **symmetric margins** for Test Data tables (100 all sides)
- Follow file naming convention: `{JIRA_KEY} - Test Evidence.docx`

---

## Reference Files

- **HTM-35258**: Simple verification test (2 steps, no Test Data section)
- **HTM-34906**: NEW eSIM Orders (3 scenarios with Test Data section)
- **HTM-34905**: UPGRADE eSIM Orders (6 scenarios with Test Data section)
- **HTM-34154**: UPGRADE orders test case template
- **HTM-34666**: NEW orders test case template  
- **HTM-34898**: Blank SIM Process - NEW Online Order (OR_01, OR_02, OR_03)
- **HTM-34899**: Blank SIM Process - NEW Instore Orders (OR_01, OR_02, OR_03)

All files follow this exact styling guide.

---

## Example Test Data Table Columns

### Standard Columns (adjust as needed per test case):
1. Test ID
2. Scenario
3. Order Type
4. Channel
5. Product
6. MPN
7. SIM Type
8. SSN
9. SIM Distributor
10. SIM Requested
11. Netcracker Update

### Test Environment Details:
- Environment: SYSTEST 3
- Default test dates: Current date (format: DD/MMM/YYYY)
- Assignee: Lucas Tran
