#!/usr/bin/env python3
"""
Resolve fifth merge conflict in index.html.
Preserves committee dashboard from HEAD, uses main branch as base.
"""

import re
import subprocess
import sys

def run_git_command(cmd):
    """Run a git command and return output."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0 and 'not something we can merge' not in result.stderr:
        print(f"Git command failed: {cmd}")
        print(f"Error: {result.stderr}")
    return result.stdout

def extract_committee_dashboard(content):
    """Extract committee dashboard section from HTML."""
    # Pattern to match committee dashboard section
    pattern = r'(<section[^>]*id="committee-dashboard"[^>]*>.*?</section>)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def extract_committee_script(content):
    """Extract committee dashboard script tag from HTML."""
    # Pattern to match committee dashboard script with flexible attributes
    pattern = r'<script[^>]*src="scripts/committees-dashboard\.js"[^>]*></script>'
    match = re.search(pattern, content)
    if match:
        return match.group(0)
    return None

def main():
    print("=" * 70)
    print("Fifth Merge Conflict Resolution")
    print("=" * 70)
    
    # Step 1: Extract committee dashboard from HEAD
    print("\n[1] Extracting committee dashboard from HEAD...")
    head_content = run_git_command('git show HEAD:index.html')
    committee_section = extract_committee_dashboard(head_content)
    
    if not committee_section:
        print("ERROR: Could not extract committee dashboard from HEAD")
        sys.exit(1)
    
    print(f"   ✓ Committee dashboard extracted: {len(committee_section)} chars")
    
    # Step 2: Extract committee script from HEAD
    print("\n[2] Extracting committee script tag from HEAD...")
    committee_script = extract_committee_script(head_content)
    
    if not committee_script:
        print("ERROR: Could not extract committee script from HEAD")
        sys.exit(1)
    
    print(f"   ✓ Committee script extracted: {len(committee_script)} chars")
    
    # Step 3: Get main branch content
    print("\n[3] Loading main branch version...")
    main_content = run_git_command('git show FETCH_HEAD:index.html')
    print(f"   ✓ Main content loaded: {len(main_content)} chars")
    
    # Step 4: Find insertion point for committee dashboard (after party dashboard)
    print("\n[4] Finding insertion point for committee dashboard...")
    # Look for end of party dashboard section followed by coalition dashboard
    party_end_pattern = r'</section>\s*\n\s*<section id="coalition-dashboard"'
    party_end_match = re.search(party_end_pattern, main_content)
    
    if not party_end_match:
        print("ERROR: Could not find party dashboard end position")
        sys.exit(1)
    
    # Insert after the closing </section> tag and newlines
    insert_pos = party_end_match.start() + len('</section>\n\n')
    print(f"   ✓ Insertion point found at position {insert_pos}")
    
    # Step 5: Insert committee dashboard
    print("\n[5] Inserting committee dashboard...")
    merged_content = (
        main_content[:insert_pos] +
        committee_section + '\n\n' +
        main_content[insert_pos:]
    )
    print(f"   ✓ Committee dashboard inserted")
    
    # Step 6: Find insertion point for committee script (after coalition script)
    print("\n[6] Finding insertion point for committee script...")
    # Pattern to match coalition script with flexible attributes (defer/async)
    coalition_script_pattern = r'<script[^>]*src="scripts/coalition-dashboard\.js"[^>]*></script>'
    coalition_script_match = re.search(coalition_script_pattern, merged_content)
    
    if not coalition_script_match:
        print("ERROR: Could not find coalition script tag")
        sys.exit(1)
    
    script_insert_pos = coalition_script_match.end()
    print(f"   ✓ Script insertion point found at position {script_insert_pos}")
    
    # Step 7: Insert committee script
    print("\n[7] Inserting committee script tag...")
    merged_content = (
        merged_content[:script_insert_pos] +
        '\n\n' + committee_script +
        merged_content[script_insert_pos:]
    )
    print(f"   ✓ Committee script inserted")
    
    # Step 8: Validate the merged content
    print("\n[8] Validating merged content...")
    
    # Check for DOCTYPE
    if '<!DOCTYPE html>' not in merged_content:
        print("ERROR: DOCTYPE missing from merged content")
        sys.exit(1)
    print("   ✓ DOCTYPE present")
    
    # Count dashboard sections
    dashboard_sections = re.findall(r'<section[^>]*id="[^"]*-dashboard"', merged_content)
    dashboard_count = len(dashboard_sections)
    print(f"   ✓ Dashboard sections found: {dashboard_count}")
    
    # List dashboard IDs
    dashboard_ids = []
    for section in dashboard_sections:
        id_match = re.search(r'id="([^"]+)"', section)
        if id_match:
            dashboard_ids.append(id_match.group(1))
    
    print("\n   Dashboard IDs:")
    for dash_id in sorted(dashboard_ids):
        print(f"      - {dash_id}")
    
    # Verify we have 9 dashboards (8 from main + 1 committee)
    if dashboard_count != 9:
        print(f"\n   WARNING: Expected 9 dashboards, found {dashboard_count}")
    else:
        print(f"\n   ✓ Correct dashboard count: {dashboard_count}")
    
    # Step 9: Write resolved content
    print("\n[9] Writing resolved content...")
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(merged_content)
    print("   ✓ File written: index.html")
    
    # Step 10: Stage the resolved file
    print("\n[10] Staging resolved file...")
    subprocess.run(['git', 'add', 'index.html'], check=True)
    print("   ✓ File staged")
    
    print("\n" + "=" * 70)
    print("✅ Fifth merge conflict resolved successfully!")
    print("=" * 70)
    print(f"\nSummary:")
    print(f"  - Committee dashboard: {len(committee_section)} chars")
    print(f"  - Committee script: {len(committee_script)} chars")
    print(f"  - Main content: {len(main_content)} chars")
    print(f"  - Final content: {len(merged_content)} chars")
    print(f"  - Total dashboards: {dashboard_count}")
    print(f"\nNext step: Complete merge commit")

if __name__ == '__main__':
    main()
