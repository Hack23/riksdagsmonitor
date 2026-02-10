#!/usr/bin/env python3
"""
Intelligent merge conflict resolution for index.html
Preserves committee dashboard from HEAD while using origin/main as base
"""
import re
import subprocess
import sys

def run_command(cmd):
    """Run a shell command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr

def extract_committee_dashboard():
    """Extract committee dashboard section and script from HEAD"""
    print("Extracting committee dashboard from HEAD...")
    
    # Read current index.html
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract committee dashboard section
    committee_pattern = r'(<section id="committee-dashboard"[^>]*>.*?</section>)'
    committee_match = re.search(committee_pattern, content, re.DOTALL)
    
    if not committee_match:
        print("ERROR: Could not find committee dashboard section in HEAD")
        return None, None
    
    committee_section = committee_match.group(1)
    print(f"✓ Found committee dashboard section ({len(committee_section)} chars)")
    
    # Extract committee dashboard script
    script_pattern = r'<script src="scripts/committees-dashboard\.js"[^>]*></script>'
    script_match = re.search(script_pattern, content)
    
    if not script_match:
        print("ERROR: Could not find committee dashboard script in HEAD")
        return committee_section, None
    
    committee_script = script_match.group(0)
    print(f"✓ Found committee dashboard script: {committee_script}")
    
    return committee_section, committee_script

def resolve_conflict(committee_section, committee_script):
    """Resolve the conflict by inserting committee dashboard into origin/main"""
    print("\nStarting merge with origin/main...")
    
    # Start the merge
    returncode, stdout, stderr = run_command('git merge origin/main --no-commit --no-ff --allow-unrelated-histories')
    
    if returncode != 0 and 'CONFLICT' not in stdout + stderr:
        print(f"ERROR: Merge command failed: {stderr}")
        return False
    
    print("✓ Merge initiated (conflicts expected)")
    
    # Get origin/main version of index.html
    print("\nUsing origin/main version as base...")
    returncode, stdout, stderr = run_command('git show origin/main:index.html')
    
    if returncode != 0:
        print(f"ERROR: Could not get origin/main version: {stderr}")
        return False
    
    main_content = stdout
    print(f"✓ Got origin/main version ({len(main_content)} chars)")
    
    # Find party dashboard end position
    print("\nFinding insertion point after party dashboard...")
    party_end_pattern = r'</section>\s*\n\s*<section id="coalition-dashboard"'
    party_end_match = re.search(party_end_pattern, main_content)
    
    if not party_end_match:
        print("ERROR: Could not find insertion point (party dashboard end)")
        return False
    
    insert_pos = party_end_match.start() + len('</section>\n\n')
    print(f"✓ Found insertion point at position {insert_pos}")
    
    # Insert committee dashboard
    print("Inserting committee dashboard section...")
    merged_content = (
        main_content[:insert_pos] +
        committee_section + '\n\n' +
        main_content[insert_pos:]
    )
    
    # Find position before </body> to insert script
    print("Inserting committee dashboard script...")
    script_insert_pattern = r'(<script src="scripts/coalition-dashboard\.js"[^>]*></script>)'
    script_insert_match = re.search(script_insert_pattern, merged_content)
    
    if not script_insert_match:
        print("WARNING: Could not find coalition dashboard script, appending before </body>")
        body_end = merged_content.rfind('</body>')
        if body_end == -1:
            print("ERROR: Could not find </body> tag")
            return False
        merged_content = (
            merged_content[:body_end] +
            '\n' + committee_script + '\n' +
            merged_content[body_end:]
        )
    else:
        # Insert after coalition dashboard script
        script_end = script_insert_match.end()
        merged_content = (
            merged_content[:script_end] +
            '\n\n' + committee_script +
            merged_content[script_end:]
        )
    
    # Write resolved file
    print("Writing resolved index.html...")
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(merged_content)
    
    print("✓ Conflict resolved")
    
    # Validate structure
    print("\nValidating HTML structure...")
    dashboard_count = len(re.findall(r'<section[^>]*id="[^"]*-dashboard"', merged_content))
    print(f"✓ Found {dashboard_count} dashboard sections")
    
    if dashboard_count != 8:
        print(f"WARNING: Expected 8 dashboards, found {dashboard_count}")
    
    # Check for DOCTYPE
    if '<!DOCTYPE html>' in merged_content:
        print("✓ DOCTYPE present")
    else:
        print("WARNING: No DOCTYPE found")
    
    # Stage the resolved file
    print("\nStaging resolved file...")
    returncode, stdout, stderr = run_command('git add index.html')
    if returncode != 0:
        print(f"ERROR: Could not stage file: {stderr}")
        return False
    
    print("✓ index.html staged")
    
    return True

def main():
    """Main execution"""
    print("="*70)
    print("Intelligent Merge Conflict Resolution for index.html")
    print("="*70)
    
    # Extract committee dashboard from HEAD
    committee_section, committee_script = extract_committee_dashboard()
    
    if not committee_section or not committee_script:
        print("\nFailed to extract committee dashboard components")
        return 1
    
    # Resolve the conflict
    if not resolve_conflict(committee_section, committee_script):
        print("\nFailed to resolve conflict")
        return 1
    
    print("\n" + "="*70)
    print("SUCCESS: Conflict resolved!")
    print("="*70)
    print("\nNext steps:")
    print("1. Review the changes: git diff --cached index.html")
    print("2. Complete the merge: git commit")
    print("3. Push changes: git push origin copilot/add-committee-performance-dashboard")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
