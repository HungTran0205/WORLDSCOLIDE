#!/usr/bin/env python3
"""
Check and install Python dependencies for skills.

This script is called by gh nova-tm init to ensure all required
Python packages are installed.
"""

import subprocess
import sys
from pathlib import Path


def check_pip():
    """Check if pip is available."""
    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"],
                      capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def install_requirements(requirements_file):
    """
    Install packages from requirements file.
    
    Args:
        requirements_file: Path to requirements.txt file
        
    Returns:
        True if successful, False otherwise
    """
    req_path = Path(requirements_file)
    
    if not req_path.exists():
        print(f"⚠️  Requirements file not found: {requirements_file}")
        return False
    
    skill_name = req_path.parent.parent.name
    print(f"📦 Installing {skill_name} dependencies...")
    
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "-r", str(req_path)],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ {skill_name} dependencies installed")
            return True
        else:
            print(f"⚠️  Warning: Could not install {skill_name} dependencies")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            return False
            
    except Exception as e:
        print(f"⚠️  Warning: Error installing {skill_name} dependencies: {e}")
        return False


def main():
    """Main entry point."""
    print("🔧 Checking Python environment...")
    
    # Check pip
    if not check_pip():
        print("❌ Error: pip is not available")
        print("   Please install pip: python -m ensurepip --upgrade")
        sys.exit(1)
    
    print("✅ pip is available")
    
    # Get skills directory
    script_dir = Path(__file__).parent
    github_dir = script_dir.parent
    skills_dir = github_dir / "skills"
    
    if not skills_dir.exists():
        print(f"⚠️  Skills directory not found: {skills_dir}")
        return
    
    # Find all requirements.txt files in skills
    requirements_files = []
    
    # Common locations for requirements.txt
    patterns = [
        "*/scripts/requirements.txt",
        "*/requirements.txt",
    ]
    
    for pattern in patterns:
        requirements_files.extend(skills_dir.glob(pattern))
    
    if not requirements_files:
        print("ℹ️  No skill requirements.txt files found")
        return
    
    print(f"📋 Found {len(requirements_files)} requirements file(s)")
    
    # Install each requirements file
    success_count = 0
    for req_file in requirements_files:
        if install_requirements(req_file):
            success_count += 1
    
    print(f"\n✅ Installed dependencies for {success_count}/{len(requirements_files)} skill(s)")
    
    if success_count < len(requirements_files):
        print("⚠️  Some dependencies could not be installed")
        print("   Skills may have limited functionality")


if __name__ == "__main__":
    main()
