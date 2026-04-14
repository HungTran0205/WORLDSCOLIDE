#!/usr/bin/env python3
"""
Generate High Level Test Plan (HLTP) Excel file from test scenarios.

Usage:
    python generate_hltp.py --data scenarios.json                    # Auto-generate filename from account
    python generate_hltp.py --data scenarios.json --output my.xlsx   # Custom output filename
    python generate_hltp.py output.xlsx --data scenarios.json        # Legacy: positional output
    
Input JSON format:
{
    "jira_id": "HTM-33785",
    "title": "Block Financial Wizard for Hybrid",
    "account": "Tesco Mobile - Block Financial Wizard for Hybrid - (CHSOW-149)",
    "summary": {
        "epic": "HTM-32266 - Price Rise 2026",
        "tester": "Lucas Tran",
        "team": "System test",
        "sprint": "",
        "version": "25.9",
        "notes": "",
        "stories": [
            {
                "id": "HTM-33096",
                "description": "CA_01 Display inventory level price in Change Tariff SO page",
                "owner": "Lucas Tran",
                "sheet": "HTM-33096"
            }
        ]
    },
    "scenarios": [
        {
            "ac": "AC_01",
            "summary": "Hybrid Account blocked from wizard",
            "conditions": {
                "Account Type": "Hybrid",
                "Action": "Click Apply Financial Transaction"
            },
            "expected": "Error: 'Service order not available to Hybrid Accounts.'"
        }
    ]
}
"""

import argparse
import json
import logging
import os
import re
import sys
from pathlib import Path

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
    from openpyxl.utils import get_column_letter
    from openpyxl.drawing.image import Image as XLImage
    from openpyxl.drawing.spreadsheet_drawing import AnchorMarker, OneCellAnchor
    from openpyxl.drawing.xdr import XDRPositiveSize2D
    from openpyxl.utils.units import pixels_to_EMU
except ImportError:
    print("Error: openpyxl not installed. Run: pip install openpyxl")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Logo constants
LOGO_SCALE = 0.4  # 40% of original size
LOGO_MARGIN_LEFT = 10  # pixels
LOGO_MARGIN_TOP = 10   # pixels

# Font size constants
HEADER_FONT_SIZE_SUMMARY = 11
HEADER_FONT_SIZE_HLTP = 10

# Row height constant
DATA_ROW_HEIGHT = 35  # pixels

# Color scheme (shared across sheets) - Trendy 2026 palette
COLOR_HEADER = "1E293B"       # Slate 800 - Modern dark
COLOR_HEADER_TEXT = "FFFFFF"  # White
COLOR_HEADER_INPUT = "0EA5E9" # Sky 500 - Conditions/Input (bright blue)
COLOR_HEADER_OUTPUT = "10B981" # Emerald 500 - Output/Expected (success green)
COLOR_SUBHEADER_INPUT = "38BDF8" # Sky 400 - Lighter for sub-headers
COLOR_ZEBRA_ODD = "FFFFFF"    # White
COLOR_ZEBRA_EVEN = "F8FAFC"   # Slate 50 - Very light gray
COLOR_LINK = "0284C7"         # Sky 600 - Link blue
COLOR_BORDER = "E2E8F0"       # Slate 200 - Light border
COLOR_BORDER_DARK = "CBD5E1"  # Slate 300 - Darker border

# Logo path relative to this script
SCRIPT_DIR = Path(__file__).parent
LOGO_PATH = SCRIPT_DIR.parent / "assets" / "hansen_logo.png"


def get_common_styles():
    """Return shared styles used across all sheets."""
    return {
        "header_font": Font(bold=True, color=COLOR_HEADER_TEXT, name="Segoe UI", size=HEADER_FONT_SIZE_SUMMARY),
        "header_font_small": Font(bold=True, color=COLOR_HEADER_TEXT, name="Segoe UI", size=HEADER_FONT_SIZE_HLTP),
        "header_fill": PatternFill(start_color=COLOR_HEADER, end_color=COLOR_HEADER, fill_type="solid"),
        "header_fill_input": PatternFill(start_color=COLOR_HEADER_INPUT, end_color=COLOR_HEADER_INPUT, fill_type="solid"),
        "header_fill_output": PatternFill(start_color=COLOR_HEADER_OUTPUT, end_color=COLOR_HEADER_OUTPUT, fill_type="solid"),
        "subheader_font": Font(bold=True, color=COLOR_HEADER_TEXT, name="Segoe UI", size=9),
        "subheader_fill_input": PatternFill(start_color=COLOR_SUBHEADER_INPUT, end_color=COLOR_SUBHEADER_INPUT, fill_type="solid"),
        "label_font": Font(bold=True, name="Segoe UI", size=10),
        "data_font": Font(name="Segoe UI", size=10),
        "link_font": Font(color=COLOR_LINK, underline="single", name="Segoe UI", size=10),
        "thin_border": Border(
            left=Side(style='thin', color=COLOR_BORDER),
            right=Side(style='thin', color=COLOR_BORDER),
            top=Side(style='thin', color=COLOR_BORDER),
            bottom=Side(style='thin', color=COLOR_BORDER)
        ),
        "bottom_border": Border(bottom=Side(style='thin', color=COLOR_BORDER_DARK)),
        "zebra_odd_fill": PatternFill(start_color=COLOR_ZEBRA_ODD, end_color=COLOR_ZEBRA_ODD, fill_type="solid"),
        "zebra_even_fill": PatternFill(start_color=COLOR_ZEBRA_EVEN, end_color=COLOR_ZEBRA_EVEN, fill_type="solid"),
        "wrap_alignment": Alignment(wrap_text=True, vertical='top'),
        "wrap_alignment_left": Alignment(horizontal='left', vertical='top', wrap_text=True),
        "center_alignment": Alignment(horizontal='center', vertical='center'),
        "left_center_alignment": Alignment(horizontal='left', vertical='center'),
        "right_center_alignment": Alignment(horizontal='right', vertical='center'),
    }


def create_summary_sheet(wb: Workbook, data: dict, logo_path: str = None):
    """Create Summary sheet with metadata and stories table.
    
    Builds the main Summary worksheet containing:
    - Company logo scaled to LOGO_SCALE (default 40%) with margin
    - Document title "High Level Test Plan"
    - Metadata section (Epic, Tester, Team, Sprint, Version, Notes)
    - Stories table with Jira hyperlinks and internal sheet links
    
    Args:
        wb: The openpyxl Workbook object.
        data: Dictionary with "summary" containing epic, tester, team, etc.
        logo_path: File path to logo image. If load fails, cell stays empty.
    
    Returns:
        None: Modifies workbook in place.
    """

    ws = wb.active
    ws.title = "Summary"
    
    # Hide gridlines
    ws.sheet_view.showGridLines = False
    
    # Get shared styles
    styles = get_common_styles()
    header_font = styles["header_font"]
    header_fill = styles["header_fill"]
    label_font = styles["label_font"]
    data_font = styles["data_font"]
    thin_border = styles["thin_border"]
    bottom_border = styles["bottom_border"]
    link_font = styles["link_font"]
    zebra_odd_fill = styles["zebra_odd_fill"]
    zebra_even_fill = styles["zebra_even_fill"]
    center_alignment = styles["center_alignment"]
    left_center_alignment = styles["left_center_alignment"]
    right_center_alignment = styles["right_center_alignment"]
    
    # Column widths (no spacer column - start from A)
    ws.column_dimensions['A'].width = 15  # Labels / Stories
    ws.column_dimensions['B'].width = 60  # Values / Story Description
    ws.column_dimensions['C'].width = 12  # Owner
    ws.column_dimensions['D'].width = 15  # Sheet
    
    # Row 1: HANSEN logo + Title (same row, no empty row)
    ws.row_dimensions[1].height = 30
    
    # Logo in A1 with margin (leave empty if load fails)
    if logo_path and Path(logo_path).exists():
        try:
            img = XLImage(logo_path)
            # Scale using constant
            img.width = img.width * LOGO_SCALE
            img.height = img.height * LOGO_SCALE
            
            # Create anchor with offset (col/row 0-indexed, offsets in EMUs)
            marker = AnchorMarker(
                col=0, colOff=pixels_to_EMU(LOGO_MARGIN_LEFT),
                row=0, rowOff=pixels_to_EMU(LOGO_MARGIN_TOP)
            )
            size = XDRPositiveSize2D(pixels_to_EMU(img.width), pixels_to_EMU(img.height))
            img.anchor = OneCellAnchor(_from=marker, ext=size)
            
            ws.add_image(img)
        except Exception as e:
            logger.warning(f"Failed to load logo '{logo_path}': {e}")
            # Leave A1 empty if logo fails to load
    
    # Title in B1 - "High Level Test Plan"
    ws['B1'] = "High Level Test Plan"
    ws['B1'].font = Font(bold=True, size=20)
    ws['B1'].alignment = Alignment(horizontal='center', vertical='center')
    
    # Summary info from data
    summary_data = data.get("summary", {})
    
    # Get tester name for Owner column
    tester_name = summary_data.get("tester", "")
    
    # Metadata rows starting at row 2
    metadata = [
        ("Epic", summary_data.get("epic", "")),
        ("Tester", tester_name),
        ("Team", summary_data.get("team", "")),
        ("Sprint", summary_data.get("sprint", "")),
        ("Version/Release", summary_data.get("version", "")),
        ("Notes", summary_data.get("notes", "")),
    ]
    
    row = 2
    for label, value in metadata:
        # Label in column A, right-aligned, bold
        cell_label = ws.cell(row=row, column=1, value=label)
        cell_label.font = label_font
        cell_label.alignment = right_center_alignment
        
        # Value in column B with bottom border
        cell_value = ws.cell(row=row, column=2, value=value)
        cell_value.border = bottom_border
        cell_value.alignment = left_center_alignment
        row += 1
    
    # Empty row before stories table
    row += 1
    
    # Stories table header
    header_row = row
    
    # Stories header (column A)
    cell = ws.cell(row=header_row, column=1, value="Stories")
    cell.font = header_font
    cell.fill = header_fill
    cell.border = thin_border
    cell.alignment = center_alignment
    
    # Story Description header (column B)
    cell = ws.cell(row=header_row, column=2, value="Story Description")
    cell.font = header_font
    cell.fill = header_fill
    cell.border = thin_border
    cell.alignment = center_alignment
    
    # Owner header (column C)
    cell = ws.cell(row=header_row, column=3, value="Owner")
    cell.font = header_font
    cell.fill = header_fill
    cell.border = thin_border
    cell.alignment = center_alignment
    
    # Sheet header (column D)
    cell = ws.cell(row=header_row, column=4, value="Sheet")
    cell.font = header_font
    cell.fill = header_fill
    cell.border = thin_border
    cell.alignment = center_alignment
    
    # Freeze pane below header row (freeze row containing "Stories")
    ws.freeze_panes = f"A{header_row + 1}"
    
    row = header_row + 1
    
    # Stories data with zebra striping
    stories = summary_data.get("stories", [])
    for idx, story in enumerate(stories):
        story_id = story.get("id", "")
        sheet_name = story.get("sheet", "")
        
        # Zebra striping - alternate row colors
        row_fill = zebra_even_fill if idx % 2 == 0 else zebra_odd_fill
        
        # Story ID as hyperlink to Jira (column A)
        cell = ws.cell(row=row, column=1, value=story_id)
        cell.font = link_font
        cell.border = thin_border
        cell.fill = row_fill
        if story_id:
            cell.hyperlink = f"https://hansentechnologies.atlassian.net/browse/{story_id}"
        cell.alignment = center_alignment

        
        # Description (column B)
        cell = ws.cell(row=row, column=2, value=story.get("description", ""))
        cell.font = data_font
        cell.border = thin_border
        cell.fill = row_fill
        cell.alignment = left_center_alignment
        
        # Owner - use tester_name (column C)
        cell = ws.cell(row=row, column=3, value=tester_name)
        cell.font = data_font
        cell.border = thin_border
        cell.fill = row_fill
        cell.alignment = left_center_alignment
        
        # Sheet link (column D)
        cell = ws.cell(row=row, column=4, value=sheet_name)
        cell.font = link_font
        cell.border = thin_border
        cell.fill = row_fill
        if sheet_name:
            cell.hyperlink = f"#'{sheet_name}'!A1"
        cell.alignment = center_alignment
        
        row += 1


def create_hltp_sheet(wb: Workbook, data: dict):
    """Create HLTP sheet with test scenarios and dynamic condition sub-columns."""
    ws = wb.create_sheet(title=data.get("jira_id", "HLTP"))
    
    # Hide gridlines
    ws.sheet_view.showGridLines = False
    
    # Get shared styles
    styles = get_common_styles()
    header_font = styles["header_font_small"]  # Slightly smaller for HLTP
    subheader_font = styles["subheader_font"]
    data_font = styles["data_font"]
    header_fill = styles["header_fill"]
    header_fill_input = styles["header_fill_input"]
    header_fill_output = styles["header_fill_output"]
    subheader_fill_input = styles["subheader_fill_input"]
    zebra_odd_fill = styles["zebra_odd_fill"]
    zebra_even_fill = styles["zebra_even_fill"]
    thin_border = styles["thin_border"]
    wrap_alignment = styles["wrap_alignment"]
    wrap_alignment_left = styles["wrap_alignment_left"]
    center_alignment = styles["center_alignment"]
    
    # Extract all unique condition keys from scenarios (preserve order)
    scenarios = data.get("scenarios", [])
    condition_keys = []
    for scenario in scenarios:
        conditions = scenario.get("conditions", {})
        if isinstance(conditions, dict):
            for key in conditions.keys():
                if key not in condition_keys:
                    condition_keys.append(key)
    
    # Calculate column positions
    # Layout: A(spacer) | B(AC) | C(#) | D(Summary) | E,F,...(Conditions) | Last(Output)
    col_offset = 2  # Data starts from column B
    col_ac = col_offset          # B
    col_num = col_offset + 1     # C
    col_summary = col_offset + 2 # D
    col_conditions_start = col_offset + 3  # E onwards
    num_condition_cols = max(len(condition_keys), 1)  # At least 1 column
    col_output = col_conditions_start + num_condition_cols  # After conditions
    
    # Title row (row 2)
    jira_id = data.get("jira_id", "")
    title = data.get("title", "")
    last_col_letter = get_column_letter(col_output)
    ws.merge_cells(f'B2:{last_col_letter}2')
    ws['B2'] = f"{jira_id} {title}"
    ws['B2'].font = Font(bold=True, size=12, color="0563C1", underline="single")
    
    
    # === Row 4: Parent Headers (with merged cells for Conditions) ===
    # AC header
    cell = ws.cell(row=4, column=col_ac, value="AC")
    cell.font = header_font
    cell.fill = header_fill
    cell.border = thin_border
    cell.alignment = center_alignment
    ws.merge_cells(start_row=4, start_column=col_ac, end_row=5, end_column=col_ac)
    
    # # header
    cell = ws.cell(row=4, column=col_num, value="#")
    cell.font = header_font
    cell.fill = header_fill
    cell.border = thin_border
    cell.alignment = center_alignment
    ws.merge_cells(start_row=4, start_column=col_num, end_row=5, end_column=col_num)
    
    # Summary header
    cell = ws.cell(row=4, column=col_summary, value="Summary")
    cell.font = header_font
    cell.fill = header_fill
    cell.border = thin_border
    cell.alignment = center_alignment
    ws.merge_cells(start_row=4, start_column=col_summary, end_row=5, end_column=col_summary)
    
    # Conditions parent header (merged across sub-columns) - Indigo for Input
    cell = ws.cell(row=4, column=col_conditions_start, value="Conditions Combinations (Input)")
    cell.font = header_font
    cell.fill = header_fill_input
    cell.border = thin_border
    cell.alignment = center_alignment
    
    # Determine if we need sub-headers (only when multiple condition columns)
    needs_subheaders = num_condition_cols > 1 and len(condition_keys) > 1
    
    if needs_subheaders:
        # Multiple sub-columns: merge header across row 4 only
        ws.merge_cells(start_row=4, start_column=col_conditions_start, 
                      end_row=4, end_column=col_conditions_start + num_condition_cols - 1)
        # Apply border to merged cells
        for c in range(col_conditions_start, col_conditions_start + num_condition_cols):
            ws.cell(row=4, column=c).border = thin_border
    else:
        # Single column: merge header across rows 4-5 (no sub-header needed)
        ws.merge_cells(start_row=4, start_column=col_conditions_start, 
                      end_row=5, end_column=col_conditions_start)
    
    # Output header - Emerald Green for Expected/Pass
    cell = ws.cell(row=4, column=col_output, value="Actions/Results (Output)")
    cell.font = header_font
    cell.fill = header_fill_output
    cell.border = thin_border
    cell.alignment = center_alignment
    ws.merge_cells(start_row=4, start_column=col_output, end_row=5, end_column=col_output)
    
    # === Row 5: Sub-headers for Conditions (only if multiple columns) ===
    if needs_subheaders:
        for idx, key in enumerate(condition_keys):
            col = col_conditions_start + idx
            cell = ws.cell(row=5, column=col, value=key)
            cell.font = subheader_font
            cell.fill = subheader_fill_input
            cell.border = thin_border
            cell.alignment = center_alignment
    
    # Apply borders to row 5 for merged cells (AC, #, Summary, Output, and Conditions if single)
    for col in [col_ac, col_num, col_summary, col_output]:
        ws.cell(row=5, column=col).border = thin_border
    if not needs_subheaders:
        ws.cell(row=5, column=col_conditions_start).border = thin_border
    
    # === Data rows (starting from row 6) ===
    data_start_row = 6
    for row_idx, scenario in enumerate(scenarios, data_start_row):
        ac = scenario.get("ac", "-") or "-"
        num = scenario.get("number", row_idx - data_start_row + 1)
        summary = scenario.get("summary", "")
        conditions = scenario.get("conditions", {})
        # Support both "expected" and "actions_results" field names
        expected = scenario.get("expected", "") or scenario.get("actions_results", "")
        
        # Zebra striping
        row_fill = zebra_even_fill if (row_idx - data_start_row) % 2 == 0 else zebra_odd_fill
        
        # AC column
        cell = ws.cell(row=row_idx, column=col_ac, value=ac)
        cell.font = data_font
        cell.border = thin_border
        cell.fill = row_fill
        cell.alignment = center_alignment
        
        # # column
        cell = ws.cell(row=row_idx, column=col_num, value=num)
        cell.font = data_font
        cell.border = thin_border
        cell.fill = row_fill
        cell.alignment = center_alignment
        
        # Summary column
        cell = ws.cell(row=row_idx, column=col_summary, value=summary)
        cell.font = data_font
        cell.border = thin_border
        cell.fill = row_fill
        cell.alignment = wrap_alignment
        
        # Condition sub-columns
        if isinstance(conditions, dict):
            for idx, key in enumerate(condition_keys):
                col = col_conditions_start + idx
                value = conditions.get(key, "")
                cell = ws.cell(row=row_idx, column=col, value=value)
                cell.font = data_font
                cell.border = thin_border
                cell.fill = row_fill
                cell.alignment = wrap_alignment_left
        else:
            # Fallback: put all conditions in first column
            cell = ws.cell(row=row_idx, column=col_conditions_start, value=str(conditions))
            cell.font = data_font
            cell.border = thin_border
            cell.fill = row_fill
            cell.alignment = wrap_alignment_left
        
        # Output column
        cell = ws.cell(row=row_idx, column=col_output, value=expected)
        cell.font = data_font
        cell.border = thin_border
        cell.fill = row_fill
        cell.alignment = wrap_alignment_left
    
    # === Column widths ===
    ws.column_dimensions['A'].width = 3  # Spacer
    ws.column_dimensions[get_column_letter(col_ac)].width = 8       # AC
    ws.column_dimensions[get_column_letter(col_num)].width = 5      # #
    ws.column_dimensions[get_column_letter(col_summary)].width = 40 # Summary
    
    # Condition columns - same width as Output
    for idx in range(num_condition_cols):
        col = col_conditions_start + idx
        ws.column_dimensions[get_column_letter(col)].width = 45
    
    ws.column_dimensions[get_column_letter(col_output)].width = 45  # Output
    
    # Auto-adjust row heights for data rows
    for row in range(data_start_row, data_start_row + len(scenarios)):
        ws.row_dimensions[row].height = DATA_ROW_HEIGHT


def create_hltp_excel(data: dict, output_path: str, logo_path: str = None, tester: str = None):
    """Create HLTP Excel file from scenario data.
    
    Supports two modes:
    1. Single sheet: data contains "scenarios" list directly
    2. Multi-sheet: data contains "sheets" dict with sheet_name -> {scenarios: [...]}
    """
    wb = Workbook()
    
    # Use default logo if not provided
    if logo_path is None and LOGO_PATH.exists():
        logo_path = str(LOGO_PATH)
    
    # Override tester if provided
    if tester:
        if "summary" not in data:
            data["summary"] = {}
        data["summary"]["tester"] = tester
    
    # Create Summary sheet (first sheet)
    create_summary_sheet(wb, data, logo_path)
    
    # Check if multi-sheet mode (has "sheets" dict)
    if "sheets" in data and isinstance(data["sheets"], dict):
        # Multi-sheet mode: create one HLTP sheet per entry
        for sheet_name, sheet_data in data["sheets"].items():
            # Get story info from summary.stories if available
            story_info = {}
            for story in data.get("summary", {}).get("stories", []):
                if story.get("sheet") == sheet_name or story.get("id") == sheet_name:
                    story_info = story
                    break
            
            # Build sheet data with jira_id and title
            hltp_data = {
                "jira_id": sheet_name,
                "title": story_info.get("description", ""),
                "scenarios": sheet_data.get("scenarios", [])
            }
            create_hltp_sheet(wb, hltp_data)
    elif "scenarios" in data:
        # Single sheet mode: create one HLTP sheet
        create_hltp_sheet(wb, data)
    
    wb.save(output_path)
    print(f"✅ HLTP generated: {output_path}")


def get_jira_display_name():
    """Try to get Jira display name from environment or config."""
    # Check environment variable first
    if os.environ.get("JIRA_USER_NAME"):
        return os.environ.get("JIRA_USER_NAME")
    # Check for .jira_user file in home directory
    user_file = Path.home() / ".jira_user"
    if user_file.exists():
        return user_file.read_text().strip()
    # Fallback to system username
    return os.environ.get("USERNAME", os.environ.get("USER", ""))


def parse_account_to_filename(account: str) -> str:
    """Parse Jira Account field to generate HLTP filename.
    
    Example:
        Input:  "Tesco Mobile - Block Financial Wizard for Hybrid - (CHSOW-149)"
        Output: "CHSOW-149 - Tesco Mobile - Block Financial Wizard for Hybrid - HLTP.xlsx"
    
    Args:
        account: The Account field from Jira ticket.
        
    Returns:
        Generated filename with .xlsx extension.
    """
    if not account:
        return None
    
    # Extract ID from parentheses at the end, e.g., (CHSOW-149)
    match = re.search(r'\(([^)]+)\)\s*$', account)
    if match:
        ticket_id = match.group(1)
        # Get the rest before the parentheses, strip trailing " - "
        rest = account[:match.start()].strip().rstrip('-').strip()
        return f"{ticket_id} - {rest} - HLTP.xlsx"
    
    # Fallback: use account as-is with HLTP suffix
    # Clean any characters not allowed in filenames
    clean_name = re.sub(r'[<>:"/\\|?*]', '-', account)
    return f"{clean_name} - HLTP.xlsx"


def main():
    parser = argparse.ArgumentParser(description="Generate HLTP Excel file")
    parser.add_argument("output", nargs='?', help="Output Excel file path (optional if --data has account field)")
    parser.add_argument("--data", help="JSON file with scenario data")
    parser.add_argument("--output", "-o", dest="output_opt", help="Output Excel file path")
    parser.add_argument("--logo", help="Path to logo image (PNG)")
    parser.add_argument("--tester", help="Tester name (auto-detect if not provided)")
    args = parser.parse_args()
    
    if args.data:
        with open(args.data, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        print("Reading JSON from stdin...")
        data = json.load(sys.stdin)
    
    # Determine output path
    output_path = args.output_opt or args.output
    
    if not output_path:
        # Try to generate from account field
        account = data.get("account", "")
        if account:
            output_path = parse_account_to_filename(account)
            logger.info(f"Auto-generated filename: {output_path}")
        else:
            # Fallback to jira_id
            jira_id = data.get("jira_id", "HLTP")
            output_path = f"{jira_id} - HLTP.xlsx"
            logger.info(f"Using jira_id for filename: {output_path}")
    
    # Auto-detect tester if not in data and not provided
    tester = args.tester
    if not tester and not data.get("summary", {}).get("tester"):
        tester = get_jira_display_name()
    
    create_hltp_excel(data, output_path, logo_path=args.logo, tester=tester)


if __name__ == "__main__":
    main()
