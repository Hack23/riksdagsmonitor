#!/usr/bin/env python3
"""
Automated resolution script for fourth merge conflict.
Handles 13 conflicted files intelligently.

Pattern: Extract committee dashboard from HEAD, use main as base, insert intelligently.
"""

import subprocess
import sys
import re

def run_command(cmd, check=True):
    """Run shell command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(f"Stderr: {result.stderr}")
        sys.exit(1)
    return result.stdout

def extract_from_git(ref, filepath):
    """Extract file content from a git reference."""
    cmd = f"git show {ref}:{filepath}"
    try:
        content = run_command(cmd, check=False)
        return content
    except:
        return None

def resolve_index_html():
    """Resolve index.html conflict by extracting committee dashboard and inserting into main."""
    print("Resolving index.html...")
    
    # Extract committee dashboard section from HEAD
    head_content = extract_from_git("HEAD", "index.html")
    if not head_content:
        print("ERROR: Could not extract HEAD:index.html")
        return False
    
    # Extract main version
    main_content = extract_from_git("FETCH_HEAD", "index.html")
    if not main_content:
        print("ERROR: Could not extract FETCH_HEAD:index.html")
        return False
    
    # Extract committee dashboard section
    committee_pattern = r'(<section id="committee-dashboard"[^>]*>.*?</section>)'
    committee_match = re.search(committee_pattern, head_content, re.DOTALL)
    if not committee_match:
        print("ERROR: Could not find committee dashboard in HEAD")
        return False
    
    committee_section = committee_match.group(1)
    print(f"  Extracted committee dashboard: {len(committee_section)} chars")
    
    # Extract committee script tag
    script_pattern = r'(<script[^>]*src="scripts/committees-dashboard\.js"[^>]*></script>)'
    script_match = re.search(script_pattern, head_content, re.DOTALL)
    if not script_match:
        print("ERROR: Could not find committee script in HEAD")
        return False
    
    committee_script = script_match.group(1)
    print(f"  Extracted committee script: {len(committee_script)} chars")
    
    # Find insertion point for committee dashboard (after party dashboard, before coalition)
    party_end_pattern = r'</section>\s*\n\s*<section id="coalition-dashboard"'
    party_end_match = re.search(party_end_pattern, main_content)
    if not party_end_match:
        print("ERROR: Could not find party dashboard end in FETCH_HEAD")
        return False
    
    insert_pos = party_end_match.start() + len('</section>\n\n')
    print(f"  Committee dashboard insertion point: {insert_pos}")
    
    # Insert committee dashboard
    merged_content = (
        main_content[:insert_pos] +
        committee_section + '\n\n' +
        main_content[insert_pos:]
    )
    
    # Find insertion point for script (after coalition script)
    # Handle both defer and non-defer versions
    script_insert_pattern = r'(<script[^>]*src="scripts/coalition-dashboard\.js"[^>]*></script>)'
    script_insert_match = re.search(script_insert_pattern, merged_content)
    if not script_insert_match:
        print("ERROR: Could not find coalition script in merged content")
        return False
    
    script_end = script_insert_match.end()
    print(f"  Committee script insertion point: {script_end}")
    
    # Insert committee script
    merged_content = (
        merged_content[:script_end] +
        '\n\n' + committee_script +
        merged_content[script_end:]
    )
    
    # Validate: count dashboards
    dashboard_count = len(re.findall(r'<section[^>]*id="[^"]*-dashboard"', merged_content))
    print(f"  Dashboard count: {dashboard_count}")
    
    # Main branch now has 8 dashboards + committee = 9 total
    if dashboard_count != 9:
        print(f"ERROR: Expected 9 dashboards, found {dashboard_count}")
        return False
    
    # Check DOCTYPE
    if not merged_content.startswith('<!DOCTYPE html>'):
        print("ERROR: DOCTYPE not found at start")
        return False
    
    # Write resolved content
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(merged_content)
    
    print("  ✓ index.html resolved successfully")
    return True

def resolve_with_main_version(filepath):
    """Resolve conflict by using main branch version."""
    print(f"Resolving {filepath} with main version...")
    
    main_content = extract_from_git("FETCH_HEAD", filepath)
    if main_content is None:
        print(f"  ERROR: Could not extract FETCH_HEAD:{filepath}")
        return False
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(main_content)
    
    print(f"  ✓ {filepath} resolved (using main)")
    return True

def main():
    """Main resolution function."""
    print("=" * 60)
    print("Fourth Merge Conflict Resolution")
    print("=" * 60)
    
    success_count = 0
    total_count = 13
    
    # Resolve index.html with intelligent merge
    if resolve_index_html():
        success_count += 1
    
    # Resolve all other files with main version
    other_files = [
        '.github/agents/data-visualization-specialist.md',
        'README.md',
        'cia-data/README.md',
        'cia-data/download-csv.sh',
        'index_ar.html',
        'index_da.html',
        'index_de.html',
        'index_es.html',
        'index_fi.html',
        'index_fr.html',
        'index_he.html',
        'js/party-dashboard.js'
    ]
    
    for filepath in other_files:
        if resolve_with_main_version(filepath):
            success_count += 1
    
    print("=" * 60)
    print(f"Resolution complete: {success_count}/{total_count} files resolved")
    print("=" * 60)
    
    if success_count == total_count:
        print("\n✓ All conflicts resolved successfully!")
        print("\nNext steps:")
        print("  1. Stage all files: git add .")
        print("  2. Complete merge: git commit")
        print("  3. Validate: grep -c 'id=\".*-dashboard\"' index.html")
        return 0
    else:
        print(f"\n✗ Failed to resolve {total_count - success_count} files")
        return 1

if __name__ == "__main__":
    sys.exit(main())
