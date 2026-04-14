# Dependencies and Setup

## Dependencies

### Required for all operations

| Dependency | Install Command | Purpose |
|------------|-----------------|---------|
| **Python 3.8+** | Pre-installed on most systems | Run editing scripts |
| **defusedxml** | `pip install defusedxml` | Secure XML parsing |

### Required for Word → Markdown conversion

| Dependency | Install Command | Purpose |
|------------|-----------------|---------|
| **pandoc** | Windows: `choco install pandoc`<br>macOS: `brew install pandoc`<br>Ubuntu: `sudo apt-get install pandoc` | Convert docx to markdown |

### Required for creating new documents (JavaScript)

| Dependency | Install Command | Purpose |
|------------|-----------------|---------|
| **Node.js** | https://nodejs.org | Run JavaScript |
| **docx** | `npm install docx` | Create Word documents |

### Optional - for converting to images

| Dependency | Install Command | Purpose |
|------------|-----------------|---------|
| **LibreOffice** | Windows: `choco install libreoffice`<br>macOS: `brew install libreoffice`<br>Ubuntu: `sudo apt-get install libreoffice` | Convert docx to PDF |
| **Poppler** | Windows: `choco install poppler`<br>macOS: `brew install poppler`<br>Ubuntu: `sudo apt-get install poppler-utils` | Convert PDF to images (pdftoppm) |

## Quick Setup

### Windows

```powershell
# Install Chocolatey first if not installed
# https://chocolatey.org/install

# Then install all dependencies
choco install python pandoc nodejs libreoffice poppler -y
pip install defusedxml
npm install -g docx
```

### macOS

```bash
brew install python pandoc node libreoffice poppler
pip install defusedxml
npm install -g docx
```

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install python3 python3-pip pandoc nodejs npm libreoffice poppler-utils -y
pip install defusedxml
npm install -g docx
```
