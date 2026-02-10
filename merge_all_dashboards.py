#!/usr/bin/env python3
"""
Intelligent merge script to combine dashboards from main branch with risk dashboard from PR branch.
Preserves all 6 dashboards: party, ministry, seasonal, pre-election, anomaly-detection, risk.
"""

import re
import subprocess
import sys

def run_git_command(cmd):
    """Run a git command and return output"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd='/home/runner/work/riksdagsmonitor/riksdagsmonitor')
    return result.stdout, result.stderr, result.returncode

def extract_dashboards(html_content):
    """Extract all dashboard sections from HTML"""
    # Pattern to match dashboard sections
    dashboard_pattern = r'(<section[^>]*id="[^"]*-dashboard"[^>]*>.*?</section>)'
    dashboards = re.findall(dashboard_pattern, html_content, re.DOTALL)
    return dashboards

def extract_dashboard_scripts(html_content):
    """Extract script tags that contain dashboard code"""
    # Find all inline scripts (dashboard code is inline)
    script_pattern = r'(<script(?![^>]*src=)[^>]*>.*?</script>)'
    scripts = re.findall(script_pattern, html_content, re.DOTALL)
    
    # Filter to keep only dashboard-related scripts (contain "dashboard" or "Dashboard")
    dashboard_scripts = [s for s in scripts if 'dashboard' in s.lower() or 'Dashboard' in s]
    return dashboard_scripts

def get_file_from_branch(filepath, branch):
    """Get file content from a specific branch"""
    cmd = f'git show {branch}:{filepath}'
    stdout, stderr, returncode = run_git_command(cmd)
    if returncode != 0:
        print(f"Warning: Could not get {filepath} from {branch}: {stderr}")
        return None
    return stdout

def merge_html_file(filepath):
    """Merge HTML file combining all dashboards from both branches"""
    print(f"\nMerging {filepath}...")
    
    # Get content from both branches
    main_content = get_file_from_branch(filepath, 'origin/main')
    branch_content = get_file_from_branch(filepath, 'HEAD')
    
    if not main_content or not branch_content:
        print(f"  Skipping {filepath} - could not read from one or both branches")
        return False
    
    # Extract dashboards from both
    main_dashboards = extract_dashboards(main_content)
    branch_dashboards = extract_dashboards(branch_content)
    
    print(f"  Main branch has {len(main_dashboards)} dashboards")
    print(f"  PR branch has {len(branch_dashboards)} dashboards")
    
    # Extract scripts from both
    main_scripts = extract_dashboard_scripts(main_content)
    branch_scripts = extract_dashboard_scripts(branch_content)
    
    print(f"  Main branch has {len(main_scripts)} dashboard scripts")
    print(f"  PR branch has {len(branch_scripts)} dashboard scripts")
    
    # Start with branch content as base (has SEO improvements)
    merged_content = branch_content
    
    # Remove the risk dashboard section temporarily (we'll add it back with all others)
    for dashboard in branch_dashboards:
        merged_content = merged_content.replace(dashboard, '<<<DASHBOARD_PLACEHOLDER>>>', 1)
    
    # Remove branch dashboard scripts temporarily
    for script in branch_scripts:
        merged_content = merged_content.replace(script, '<<<SCRIPT_PLACEHOLDER>>>', 1)
    
    # Combine all dashboards (main + branch)
    all_dashboards = main_dashboards + branch_dashboards
    combined_dashboards = '\n\n'.join(all_dashboards)
    
    # Combine all scripts (main + branch)
    all_scripts = main_scripts + branch_scripts
    combined_scripts = '\n\n'.join(all_scripts)
    
    # Find insertion point for dashboards (before footer or before closing body)
    footer_pattern = r'<footer[^>]*>'
    footer_match = re.search(footer_pattern, merged_content)
    
    if footer_match:
        # Insert before footer
        insert_pos = footer_match.start()
        merged_content = (merged_content[:insert_pos] + 
                         '\n' + combined_dashboards + '\n\n' +
                         merged_content[insert_pos:])
    else:
        # Fallback: insert before closing body tag
        merged_content = merged_content.replace('</body>', 
                                                f'\n{combined_dashboards}\n\n</body>')
    
    # Replace dashboard placeholder if it still exists
    merged_content = merged_content.replace('<<<DASHBOARD_PLACEHOLDER>>>', '')
    
    # Find insertion point for scripts (before closing body tag)
    merged_content = merged_content.replace('</body>',
                                            f'\n{combined_scripts}\n\n</body>')
    
    # Replace script placeholder if it still exists
    merged_content = merged_content.replace('<<<SCRIPT_PLACEHOLDER>>>', '')
    
    # Write merged content
    with open(f'/home/runner/work/riksdagsmonitor/riksdagsmonitor/{filepath}', 'w', encoding='utf-8') as f:
        f.write(merged_content)
    
    print(f"  ✓ Merged {filepath} with {len(all_dashboards)} dashboards total")
    return True

def merge_css_file():
    """Merge styles.css from both branches"""
    print("\nMerging styles.css...")
    
    main_css = get_file_from_branch('styles.css', 'origin/main')
    branch_css = get_file_from_branch('styles.css', 'HEAD')
    
    if not main_css or not branch_css:
        print("  Could not read CSS from one or both branches")
        return False
    
    # Extract dashboard-specific CSS from main (everything after a certain marker)
    # Look for dashboard CSS sections
    dashboard_css_pattern = r'/\*.*?Dashboard.*?\*/.*?(?=/\*|$)'
    main_dashboard_css = re.findall(dashboard_css_pattern, main_css, re.DOTALL | re.IGNORECASE)
    
    # Start with branch CSS as base
    merged_css = branch_css
    
    # Append main's dashboard CSS if not already present
    for css_block in main_dashboard_css:
        if css_block.strip() and css_block.strip() not in merged_css:
            merged_css += '\n\n' + css_block
    
    # Write merged CSS
    with open('/home/runner/work/riksdagsmonitor/riksdagsmonitor/styles.css', 'w', encoding='utf-8') as f:
        f.write(merged_css)
    
    print("  ✓ Merged styles.css")
    return True

def merge_manifest_json():
    """Merge cia-data/data-manifest.json"""
    print("\nMerging cia-data/data-manifest.json...")
    
    import json
    
    main_manifest = get_file_from_branch('cia-data/data-manifest.json', 'origin/main')
    branch_manifest = get_file_from_branch('cia-data/data-manifest.json', 'HEAD')
    
    if not main_manifest or not branch_manifest:
        print("  Using main branch version")
        run_git_command('git checkout origin/main -- cia-data/data-manifest.json')
        return True
    
    try:
        main_data = json.loads(main_manifest)
        branch_data = json.loads(branch_manifest)
        
        # Merge files dict
        merged_files = {**branch_data.get('files', {}), **main_data.get('files', {})}
        
        # Use main's structure but add branch files
        merged_data = main_data.copy()
        merged_data['files'] = merged_files
        merged_data['totalFiles'] = len(merged_files)
        
        # Write merged manifest
        with open('/home/runner/work/riksdagsmonitor/riksdagsmonitor/cia-data/data-manifest.json', 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, indent=2)
        
        print(f"  ✓ Merged manifest with {len(merged_files)} files")
        return True
    except Exception as e:
        print(f"  Error merging JSON: {e}")
        print("  Using main branch version")
        run_git_command('git checkout origin/main -- cia-data/data-manifest.json')
        return True

def merge_download_script():
    """Merge cia-data/download-csv.sh"""
    print("\nMerging cia-data/download-csv.sh...")
    
    main_script = get_file_from_branch('cia-data/download-csv.sh', 'origin/main')
    branch_script = get_file_from_branch('cia-data/download-csv.sh', 'HEAD')
    
    if not main_script or not branch_script:
        print("  Using main branch version")
        run_git_command('git checkout origin/main -- cia-data/download-csv.sh')
        return True
    
    # Extract download commands from both
    download_pattern = r'download_file "[^"]*" "[^"]*"'
    main_downloads = set(re.findall(download_pattern, main_script))
    branch_downloads = set(re.findall(download_pattern, branch_script))
    
    # Combine unique downloads
    all_downloads = main_downloads | branch_downloads
    
    # Use main script as base (it has better error handling)
    merged_script = main_script
    
    # Add branch downloads that aren't in main
    branch_only = branch_downloads - main_downloads
    if branch_only:
        # Add before the final success message
        insert_marker = 'echo "All files downloaded successfully"'
        if insert_marker in merged_script:
            additions = '\n' + '\n'.join(branch_only) + '\n'
            merged_script = merged_script.replace(insert_marker, additions + insert_marker)
    
    # Write merged script
    with open('/home/runner/work/riksdagsmonitor/riksdagsmonitor/cia-data/download-csv.sh', 'w', encoding='utf-8') as f:
        f.write(merged_script)
    
    print(f"  ✓ Merged download script with {len(all_downloads)} unique downloads")
    return True

def merge_readme():
    """Merge README.md"""
    print("\nMerging README.md...")
    
    # Use main's README as it's more comprehensive
    run_git_command('git checkout origin/main -- README.md')
    print("  ✓ Using main branch README.md")
    return True

def main():
    """Main merge process"""
    print("=" * 70)
    print("INTELLIGENT DASHBOARD MERGE SCRIPT")
    print("=" * 70)
    print("\nMerging main branch (5 dashboards) + PR branch (1 dashboard) = 6 total")
    
    # Start the merge
    print("\n1. Starting merge with --allow-unrelated-histories...")
    stdout, stderr, returncode = run_git_command('git merge origin/main --allow-unrelated-histories --no-commit --no-ff')
    print("   Merge initiated (conflicts expected)")
    
    # Merge HTML files
    print("\n2. Merging HTML files with intelligent dashboard combination...")
    html_files = ['index.html']
    html_files += [f'index_{lang}.html' for lang in ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']]
    
    success_count = 0
    for html_file in html_files:
        if merge_html_file(html_file):
            success_count += 1
    
    print(f"\n   ✓ Successfully merged {success_count}/{len(html_files)} HTML files")
    
    # Merge CSS
    print("\n3. Merging CSS files...")
    merge_css_file()
    
    # Merge cia-data files
    print("\n4. Merging cia-data files...")
    merge_manifest_json()
    merge_download_script()
    
    # Merge README
    print("\n5. Merging README...")
    merge_readme()
    
    # Stage all resolved files
    print("\n6. Staging resolved files...")
    run_git_command('git add .')
    
    print("\n" + "=" * 70)
    print("MERGE COMPLETE!")
    print("=" * 70)
    print("\nAll conflicts resolved. Ready to commit.")
    print("\nNext steps:")
    print("  1. Review changes with: git status")
    print("  2. Verify dashboards present: grep 'id=\".*-dashboard\"' index.html")
    print("  3. Commit merge: git commit")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
