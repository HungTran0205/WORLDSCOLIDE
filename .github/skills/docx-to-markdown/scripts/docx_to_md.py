#!/usr/bin/env python3
"""
Convert Word documents (.docx) to Markdown for easy reading by AI agents.

Usage:
    python docx_to_md.py <input.docx> [output.md] [--track-changes]
    
Examples:
    python docx_to_md.py document.docx                    # Output to stdout
    python docx_to_md.py document.docx output.md          # Output to file
    python docx_to_md.py document.docx -t                 # Show tracked changes
    python docx_to_md.py document.docx output.md --track-changes

Options:
    --track-changes, -t    Show tracked changes (insertions/deletions)
    --accept               Accept all changes (show final version)
    --reject               Reject all changes (show original version)

License: MIT
"""

import sys
import zipfile
import re
import os
from pathlib import Path

try:
    import pypandoc
except ImportError:
    pypandoc = None

try:
    from PIL import Image
except ImportError:
    Image = None


def extract_strings_from_bin(bin_path, min_len=10):
    """
    Extract readable strings from a binary OLE file.
    Retains structure if it looks like JSON or XML.
    """
    try:
        with open(bin_path, "rb") as f:
            data = f.read()
            
        # Regex to find sequences of printable chars (including newlines/tabs)
        # This covers ASCII range roughly. 
        pattern = rb"[\x09\x0A\x0D\x20-\x7E]{" + str(min_len).encode() + rb",}"
        
        matches = re.findall(pattern, data)
        strings = [m.decode('ascii', errors='ignore') for m in matches]
        
        # Combine matches, but we need to find the "payload"
        # Often the file starts with metadata paths, then the content.
        
        full_text = "\n".join(strings)
        
        # Heuristic to find JSON
        json_start = full_text.find('{')
        json_end = full_text.rfind('}')
        if json_start != -1 and json_end != -1 and json_end > json_start:
             potential_json = full_text[json_start:json_end+1]
             # Basic validation
             if potential_json.count('{') > 0:
                 return potential_json, "json"

        # Heuristic to find XML
        xml_start = full_text.find('<')
        xml_end = full_text.rfind('>')
        if xml_start != -1 and xml_end != -1 and xml_end > xml_start:
             potential_xml = full_text[xml_start:xml_end+1]
             if "<?xml" in potential_xml or "<xsd:schema" in potential_xml:
                 return potential_xml, "xml"
                 
        return full_text, "text"
        
    except Exception as e:
        return None, None

def extract_embeddings(input_docx, media_dir):
    """
    Extract embedded files from word/embeddings folder in the docx zip.
    """
    extracted_files = []
    try:
        with zipfile.ZipFile(input_docx, 'r') as zip_ref:
            # Look for files in word/embeddings/
            for file_info in zip_ref.infolist():
                if file_info.filename.startswith('word/embeddings/'):
                    # Extract the file
                    # We flatten the structure: word/embeddings/file.bin -> media_dir/file.bin
                    filename = Path(file_info.filename).name
                    if not filename: continue
                    
                    target_path = media_dir / filename
                    
                    # Overwrite existing files
                    with zip_ref.open(file_info) as source, open(target_path, "wb") as target:
                        target.write(source.read())
                    
                    extracted_files.append(target_path.name)
    except Exception as e:
        print(f"Warning: Failed to extract embeddings: {e}", file=sys.stderr)
        
    return extracted_files

def docx_to_markdown(
    input_file: str,
    output_file: str = None,
    track_changes: str = "accept"
) -> str:
    """
    Convert .docx to Markdown using pypandoc.
    
    Args:
        input_file: Path to .docx file
        output_file: Path to output .md file on (optional, prints to stdout if None)
        track_changes: How to handle tracked changes:
            - "accept": Accept all changes (default, shows final version)
            - "reject": Reject all changes (shows original version)
            - "all": Show both insertions and deletions marked
            
    Returns:
        Markdown content as string
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_file}")
    
    if input_path.suffix.lower() != '.docx':
        raise ValueError(f"Expected .docx file, got: {input_path.suffix}")
    
    if pypandoc is None:
        raise RuntimeError(
            "pypandoc not found. Please run: pip install pypandoc_binary"
        )
    
    # Determine media directory
    media_dir = None
    if output_file:
         output_path = Path(output_file)
         # create a 'media' folder next to the output file
         media_dir = output_path.parent / (output_path.stem + "_media")
         media_dir_arg = str(media_dir)
    else:
         # If no output file, use a temp dir or just 'media' in cwd? 
         # For stdout output, maybe just use 'media' locally
         media_dir = Path("media")
         media_dir_arg = "media"

    if not media_dir.exists():
        media_dir.mkdir(parents=True, exist_ok=True)

    # Build extra args for pypandoc
    # Enable common table extensions and media extraction
    extra_args = [
        '--wrap=none',
        f'--track-changes={track_changes}',
        f'--extract-media={str(media_dir_arg)}',
        # Ensure we have good table support (grid_tables, pipe_tables are usually on by default in 'markdown' output)
        #'--from=docx',
        #'--to=gfm' # GitHub Flavored Markdown often handles tables well
    ]
    
    try:
        # Convert to markdown string
        # using 'gfm' (GitHub Flavored Markdown) usually gives good table results
        markdown = pypandoc.convert_file(
            str(input_path),
            'gfm', 
            extra_args=extra_args
        )
    except Exception as e:
        # Fallback to standard markdown if gfm fails or isn't desired
        print(f"Warning: GFM conversion failed or issue with args, retrying with standard markdown: {e}", file=sys.stderr)
        markdown = pypandoc.convert_file(
           str(input_path),
           'markdown',
           extra_args=extra_args
        )

    # Calculate relative path for media in markdown links
    # If using absolute path in extract-media, pandoc relies on that.
    # Convert absolute links to relative if output_file is present
    if output_file:
         output_path = Path(output_file)
         # Pandoc with --extract-media uses the path provided. 
         # If we used absolute path for media_dir, we might need to adjust.
         # But using local 'media' usually works well.
         pass

    # Convert EMF/WMF images to PNG if Pillow is available
    if Image and media_dir and media_dir.exists():
        for root, _, files in os.walk(media_dir):
            for file in files:
                lower_name = file.lower()
                if lower_name.endswith('.emf') or lower_name.endswith('.wmf'):
                    original_path = Path(root) / file
                    new_file = f"{Path(file).stem}.png"
                    new_path = Path(root) / new_file
                    
                    try:
                        with Image.open(original_path) as img:
                            # Save as PNG
                            img.save(new_path, format="PNG")
                        
                        # Update markdown content references
                        # We need to handle both absolute and relative paths that might be in the markdown
                        # Simple extension replacement in the filename should be safe enough given the context
                        # Replace 'filename.emf' with 'filename.png'
                        # Be careful not to replace it if it's not part of a link or path
                        
                        markdown = markdown.replace(file, new_file)
                        
                        # Remove original
                        original_path.unlink()
                        
                    except Exception as e:
                        print(f"Warning: Failed to convert {file}: {e}", file=sys.stderr)

    # Extract embeddings manually
    embeddings = extract_embeddings(input_path, media_dir)
    
    if embeddings:
        markdown += "\n\n## Attached Files (Embeddings)\n\n"
        for embed in embeddings:
             abs_path = media_dir / embed
             
             # Attempt to extract content from OLE
             content, type_ = extract_strings_from_bin(abs_path)
             
             if content and type_ in ['json', 'xml']:
                 markdown += f"**File:** {embed}\n\n"
                 markdown += f"```{type_}\n{content}\n```\n\n"
             else:
                 markdown += f"- {embed} (Binary object)\n"

    # Output
    if output_file:
        output_path = Path(output_file)
        output_path.write_text(markdown, encoding='utf-8')
        print(f"Converted: {input_path} → {output_path}")
        print(f"Media extracted to: {media_dir}")

    # Cleanup extracted bin files
    if embeddings:
        for embed in embeddings:
            embed_path = media_dir / embed
            try:
                if embed_path.exists():
                    embed_path.unlink()
            except OSError as e:
                print(f"Warning: Failed to cleanup {embed}: {e}", file=sys.stderr)
    
    return markdown


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = None
    track_changes = "accept"
    
    # Parse arguments
    args = sys.argv[2:]
    i = 0
    while i < len(args):
        arg = args[i]
        if arg in ('--track-changes', '-t'):
            track_changes = "all"
        elif arg == '--accept':
            track_changes = "accept"
        elif arg == '--reject':
            track_changes = "reject"
        elif not arg.startswith('-'):
            output_file = arg
        i += 1
    
    try:
        markdown = docx_to_markdown(input_file, output_file, track_changes)
        
        # Print to stdout if no output file
        if not output_file:
            print(markdown)
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
