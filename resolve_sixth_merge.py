#!/usr/bin/env python3
"""
Automated resolution script for sixth merge conflict in index.html.

This script:
1. Extracts committee dashboard section from HEAD
2. Extracts committee script tag from HEAD  
3. Uses origin/main as base (contains 8 dashboards)
4. Inserts committee dashboard after party dashboard
5. Inserts committee script after coalition script
6. Validates 9 dashboards are present
7. Writes resolved content to index.html
"""

import re
import subprocess
import sys

def run_git_command(cmd):
    """Run a git command and return output."""
    result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}", file=sys.stderr)
        print(f"Error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return result.stdout

def main():
    print("Starting sixth merge conflict resolution...")
    
    # Step 1: Extract committee dashboard from HEAD
    print("\n1. Extracting committee dashboard from HEAD...")
    head_content = run_git_command('git show HEAD:index.html')
    
    # Find committee dashboard section
    committee_pattern = r'(<section[^>]*id="committee-dashboard"[^>]*>.*?</section>)'
    committee_match = re.search(committee_pattern, head_content, re.DOTALL)
    
    if not committee_match:
        print("ERROR: Could not find committee dashboard in HEAD", file=sys.stderr)
        sys.exit(1)
    
    committee_section = committee_match.group(1)
    print(f"   Found committee dashboard: {len(committee_section)} chars")
    
    # Step 2: Extract committee script from HEAD
    print("\n2. Extracting committee script tag from HEAD...")
    script_pattern = r'<script[^>]*src="scripts/committees-dashboard\.js"[^>]*></script>'
    script_match = re.search(script_pattern, head_content)
    
    if not script_match:
        print("ERROR: Could not find committee script in HEAD", file=sys.stderr)
        sys.exit(1)
    
    committee_script = script_match.group(0)
    print(f"   Found committee script: {len(committee_script)} chars")
    
    # Step 3: Get main branch content as base
    print("\n3. Getting main branch content as base...")
    main_content = run_git_command('git show origin/main:index.html')
    print(f"   Main branch content: {len(main_content)} chars")
    
    # Step 4: Find insertion point for committee dashboard (after party dashboard)
    print("\n4. Finding insertion point for committee dashboard...")
    # Look for end of party-dashboard section followed by coalition-dashboard
    party_end_pattern = r'</section>\s*\n\s*<section[^>]*id="coalition-dashboard"'
    party_end_match = re.search(party_end_pattern, main_content)
    
    if not party_end_match:
        print("ERROR: Could not find party dashboard end position", file=sys.stderr)
        sys.exit(1)
    
    # Insert after the </section> closing tag of party dashboard
    insert_pos = party_end_match.start() + len('</section>\n\n')
    print(f"   Insert position: {insert_pos}")
    
    # Insert committee dashboard
    merged_content = (
        main_content[:insert_pos] +
        committee_section + '\n\n' +
        main_content[insert_pos:]
    )
    
    # Step 5: Find insertion point for committee script (after coalition script)
    print("\n5. Finding insertion point for committee script...")
    # Look for coalition dashboard script tag
    coalition_script_pattern = r'<script[^>]*src="scripts/coalition-dashboard\.js"[^>]*></script>'
    coalition_script_match = re.search(coalition_script_pattern, merged_content)
    
    if not coalition_script_match:
        print("ERROR: Could not find coalition script tag", file=sys.stderr)
        sys.exit(1)
    
    script_insert_pos = coalition_script_match.end()
    print(f"   Script insert position: {script_insert_pos}")
    
    # Insert committee script
    merged_content = (
        merged_content[:script_insert_pos] +
        '\n\n' + committee_script +
        merged_content[script_insert_pos:]
    )
    
    # Step 6: Validate the merged content
    print("\n6. Validating merged content...")
    
    # Check for DOCTYPE
    if not merged_content.strip().startswith('<!DOCTYPE html>'):
        print("ERROR: DOCTYPE not found at start", file=sys.stderr)
        sys.exit(1)
    print("   ✓ DOCTYPE present")
    
    # Count dashboard sections
    dashboard_pattern = r'<section[^>]*id="[^"]*-dashboard"'
    dashboards = re.findall(dashboard_pattern, merged_content)
    dashboard_count = len(dashboards)
    print(f"   ✓ Dashboard count: {dashboard_count}")
    
    if dashboard_count != 9:
        print(f"ERROR: Expected 9 dashboards, found {dashboard_count}", file=sys.stderr)
        sys.exit(1)
    
    # List all dashboard IDs
    dashboard_ids = []
    for match in re.finditer(r'<section[^>]*id="([^"]*-dashboard)"', merged_content):
        dashboard_ids.append(match.group(1))
    
    print("   ✓ Dashboard IDs found:")
    for dash_id in sorted(dashboard_ids):
        print(f"      - {dash_id}")
    
    # Step 7: Write resolved content
    print("\n7. Writing resolved content to index.html...")
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(merged_content)
    
    print(f"   ✓ Written {len(merged_content)} chars to index.html")
    
    print("\n✅ Sixth merge conflict resolution complete!")
    print(f"   - Committee dashboard: Inserted at position {insert_pos}")
    print(f"   - Committee script: Inserted at position {script_insert_pos}")
    print(f"   - Total dashboards: {dashboard_count}")
    print(f"   - Final content size: {len(merged_content)} chars")

if __name__ == '__main__':
    main()
