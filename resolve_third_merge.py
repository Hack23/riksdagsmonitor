#!/usr/bin/env python3
"""
Intelligent merge resolution script for committee dashboard branch.
This script resolves merge conflicts by:
1. Extracting committee dashboard from HEAD
2. Using FETCH_HEAD (main) as base
3. Inserting committee dashboard after party dashboard
4. Validating HTML structure
"""

import re
import sys

def extract_section(content, section_id):
    """Extract a dashboard section by ID."""
    pattern = rf'(<section[^>]*id="{section_id}"[^>]*>.*?</section>)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def extract_script_tag(content, script_src):
    """Extract a script tag by src attribute."""
    pattern = rf'(<script[^>]*src="{script_src}"[^>]*></script>)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def validate_html(content):
    """Validate basic HTML structure."""
    # Check for DOCTYPE
    if not content.strip().startswith('<!DOCTYPE html>'):
        return False, "Missing DOCTYPE"
    
    # Count dashboard sections
    dashboard_count = len(re.findall(r'<section[^>]*id="[^"]*-dashboard"', content))
    
    return True, f"{dashboard_count} dashboards found"

def resolve_conflict():
    """Main conflict resolution logic."""
    print("Reading conflicted index.html...")
    with open('index.html', 'r', encoding='utf-8') as f:
        conflicted_content = f.read()
    
    # Extract HEAD and FETCH_HEAD versions
    print("Extracting HEAD and FETCH_HEAD versions...")
    
    # Check if there are conflict markers
    if '<<<<<<< HEAD' not in conflicted_content:
        print("ERROR: No conflict markers found - file may already be resolved")
        return False
    
    # For this case, we need to:
    # 1. Extract committee dashboard section from HEAD
    # 2. Extract committee script from HEAD
    # 3. Use FETCH_HEAD (main) as base
    # 4. Insert committee dashboard and script in appropriate positions
    
    print("Extracting committee dashboard from HEAD...")
    
    # Use git to get clean versions
    import subprocess
    
    print("Getting clean HEAD version...")
    result = subprocess.run(['git', 'show', 'HEAD:index.html'], 
                          capture_output=True, text=True, check=True)
    head_version = result.stdout
    
    print("Getting clean FETCH_HEAD version...")
    result = subprocess.run(['git', 'show', 'FETCH_HEAD:index.html'], 
                          capture_output=True, text=True, check=True)
    main_version = result.stdout
    
    # Extract committee dashboard from HEAD
    committee_section = extract_section(head_version, 'committee-dashboard')
    if not committee_section:
        print("ERROR: Could not extract committee dashboard from HEAD")
        return False
    
    print(f"Extracted committee dashboard section ({len(committee_section)} chars)")
    
    # Extract committee script from HEAD
    committee_script = extract_script_tag(head_version, 'scripts/committees-dashboard.js')
    if not committee_script:
        print("ERROR: Could not extract committee script from HEAD")
        return False
    
    print(f"Extracted committee script tag ({len(committee_script)} chars)")
    
    # Use main version as base
    merged_content = main_version
    
    # Find insertion point after party dashboard
    print("Finding insertion point for committee dashboard...")
    party_end_pattern = r'</section>\s*\n\s*<section id="coalition-dashboard"'
    party_end_match = re.search(party_end_pattern, merged_content)
    
    if not party_end_match:
        print("ERROR: Could not find party dashboard end")
        return False
    
    # Insert committee dashboard after party dashboard
    insert_pos = party_end_match.start() + len('</section>\n\n')
    print(f"Inserting committee dashboard at position {insert_pos}")
    
    merged_content = (
        merged_content[:insert_pos] +
        committee_section + '\n\n' +
        merged_content[insert_pos:]
    )
    
    # Find insertion point for committee script (after coalition script)
    print("Finding insertion point for committee script...")
    coalition_script_pattern = r'<script[^>]*src="scripts/coalition-dashboard\.js"[^>]*></script>'
    coalition_script_match = re.search(coalition_script_pattern, merged_content)
    
    if not coalition_script_match:
        print("ERROR: Could not find coalition script")
        return False
    
    script_end = coalition_script_match.end()
    print(f"Inserting committee script at position {script_end}")
    
    merged_content = (
        merged_content[:script_end] +
        '\n\n' + committee_script +
        merged_content[script_end:]
    )
    
    # Validate
    print("Validating merged HTML...")
    valid, message = validate_html(merged_content)
    if not valid:
        print(f"ERROR: Validation failed: {message}")
        return False
    
    print(f"Validation passed: {message}")
    
    # Write resolved file
    print("Writing resolved index.html...")
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(merged_content)
    
    print("SUCCESS: Conflict resolved!")
    print("Next steps:")
    print("  git add index.html")
    print("  git commit")
    
    return True

if __name__ == '__main__':
    success = resolve_conflict()
    sys.exit(0 if success else 1)
