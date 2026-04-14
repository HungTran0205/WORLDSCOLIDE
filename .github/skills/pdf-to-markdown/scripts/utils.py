"""
Utility functions for PDF processing.
"""

def table_to_markdown(table):
    """
    Convert a table (list of lists) to Markdown format.
    
    Args:
        table: List of rows, where each row is a list of cells
        
    Returns:
        Markdown formatted table string
    """
    if not table or len(table) < 1:
        return ""
    
    md_lines = []
    
    # Clean and prepare cells
    def clean_cell(cell):
        if cell is None:
            return ""
        # Replace newlines with spaces, escape pipes
        return str(cell).replace("\n", " ").replace("|", "\\|").strip()
    
    # Header row
    header = table[0]
    md_lines.append("| " + " | ".join(clean_cell(cell) for cell in header) + " |")
    md_lines.append("|" + "|".join("---" for _ in header) + "|")
    
    # Data rows
    for row in table[1:]:
        # Ensure row has same number of cells as header
        padded_row = list(row) + [""] * (len(header) - len(row))
        md_lines.append("| " + " | ".join(clean_cell(cell) for cell in padded_row[:len(header)]) + " |")
    
    return "\n".join(md_lines)
