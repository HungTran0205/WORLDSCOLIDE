# WORLDSCOLIDE Economy Calculator

## File Update - April 22, 2026

**IMPORTANT:** The original `economy-calculator.xlsx` file was created in JSON format and cannot be opened directly in Excel. I've created a new CSV version that Excel can open.

## Files Available

- `economy-calculator-fixed.csv` - **USE THIS FILE** - CSV format that Excel can open directly
- `ECONOMY-CALCULATOR-README.md` - This documentation

## How to Open and Use

### Step 1: Open in Excel
1. Double-click `economy-calculator-fixed.csv`
2. Excel will open it and may ask about file format - choose "CSV"
3. The file will open as a spreadsheet

### Step 2: Enable Formulas (Important!)
CSV files open with formulas as text. To make them work:

1. **Save as Excel Workbook:**
   - Go to File → Save As
   - Choose "Excel Workbook (*.xlsx)" format
   - Save as `economy-calculator-working.xlsx`

2. **Convert Text to Formulas:**
   - Select all cells with formulas (they appear as text starting with `=`)
   - Go to Home tab → Find & Select → Replace
   - Find: `="` (equals quote)
   - Replace with: `=` (just equals)
   - Click "Replace All"
   - This converts text formulas back to working formulas

### Step 3: Test the Calculator
- Change the difficulty level in cell B6
- Modify upgrade tiers in cells B9-B13
- Adjust member assignments in cells B16-B18
- Watch all calculations update automatically!