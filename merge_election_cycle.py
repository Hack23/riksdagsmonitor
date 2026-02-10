#!/usr/bin/env python3
"""
Intelligent merge script for election-cycle dashboard into main branch HTML files.
Extracts election-cycle dashboard from our branch and inserts it into main's HTML.
"""

import re
import sys

def extract_election_cycle_dashboard(content):
    """Extract the election-cycle dashboard section from HTML."""
    # Extract dashboard section
    dashboard_pattern = r'(<section[^>]*id="election-cycle-dashboard"[^>]*>.*?</section>)'
    dashboard_match = re.search(dashboard_pattern, content, re.DOTALL)
    
    # Extract script tag
    script_pattern = r'(<script src="js/election-cycle-dashboard\.js"></script>)'
    script_match = re.search(script_pattern, content)
    
    return dashboard_match.group(1) if dashboard_match else None, script_match.group(1) if script_match else None

def merge_html_files(ours_file, theirs_file, output_file):
    """Merge HTML files intelligently."""
    
    with open(ours_file, 'r', encoding='utf-8') as f:
        ours_content = f.read()
    
    with open(theirs_file, 'r', encoding='utf-8') as f:
        theirs_content = f.read()
    
    # Extract election-cycle dashboard from our branch
    dashboard_section, dashboard_script = extract_election_cycle_dashboard(ours_content)
    
    if not dashboard_section:
        print(f"Warning: Could not find election-cycle dashboard in {ours_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(theirs_content)
        return False
    
    # Start with main's content (theirs)
    merged_content = theirs_content
    
    # Find insertion point for dashboard - before </main> or before footer
    main_close_match = re.search(r'</main>', merged_content)
    footer_match = re.search(r'<footer', merged_content)
    
    if main_close_match:
        insert_pos = main_close_match.start()
    elif footer_match:
        insert_pos = footer_match.start()
    else:
        print(f"Warning: Could not find insertion point in {theirs_file}")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(theirs_content)
        return False
    
    # Insert dashboard section
    merged_content = (
        merged_content[:insert_pos] +
        '\n' + dashboard_section + '\n' +
        merged_content[insert_pos:]
    )
    
    # Insert script tag before </body>
    if dashboard_script:
        body_close_match = re.search(r'</body>', merged_content)
        if body_close_match:
            script_insert_pos = body_close_match.start()
            merged_content = (
                merged_content[:script_insert_pos] +
                dashboard_script + '\n' +
                merged_content[script_insert_pos:]
            )
    
    # Write merged content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(merged_content)
    
    return True

def merge_css_files(ours_file, theirs_file, output_file):
    """Merge CSS files by appending unique styles from ours to theirs."""
    
    with open(ours_file, 'r', encoding='utf-8') as f:
        ours_content = f.read()
    
    with open(theirs_file, 'r', encoding='utf-8') as f:
        theirs_content = f.read()
    
    # Find election-cycle specific CSS
    election_cycle_pattern = r'/\*\s*Election Cycle Dashboard Styles.*?\*/.*?(?=(?:/\*|$))'
    election_match = re.search(election_cycle_pattern, ours_content, re.DOTALL)
    
    # Also find UI/UX enhancements section
    ui_ux_pattern = r'/\*\s*={3,}\s*UI/UX ENHANCEMENTS.*?$'
    ui_ux_match = re.search(ui_ux_pattern, ours_content, re.DOTALL | re.MULTILINE)
    
    merged_content = theirs_content
    
    # Append election-cycle CSS if found
    if election_match:
        merged_content += '\n\n' + election_match.group(0)
    
    # Append UI/UX enhancements if found and not already in theirs
    if ui_ux_match:
        ui_ux_content = ui_ux_match.group(0)
        if 'UI/UX ENHANCEMENTS' not in theirs_content:
            merged_content += '\n\n' + ui_ux_content
    
    # Write merged content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(merged_content)
    
    return True

if __name__ == '__main__':
    import os
    
    # Resolve conflicts for index.html
    print("Merging index.html...")
    success = merge_html_files(
        '/tmp/index_ours.html',
        '/tmp/index_theirs.html', 
        'index.html'
    )
    print(f"  {'✓' if success else '✗'} index.html merged")
    
    # Resolve conflicts for styles.css
    print("Merging styles.css...")
    success = merge_css_files(
        '/tmp/styles_ours.css',
        '/tmp/styles_theirs.css',
        'styles.css'
    )
    print(f"  {'✓' if success else '✗'} styles.css merged")
    
    print("\nMerge complete!")
