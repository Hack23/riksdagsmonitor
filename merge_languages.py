#!/usr/bin/env python3
"""Merge language files with coalition dashboard"""
import re, subprocess, sys

languages = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']

for lang in languages:
    filename = f'index_{lang}.html'
    print(f"Merging {filename}...")
    
    # Get main version
    result = subprocess.run(['git', 'show', f'FETCH_HEAD:{filename}'], 
                          capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ERROR: Could not get main version")
        continue
    main_html = result.stdout
    
    # Get our version
    try:
        with open(filename, 'r') as f:
            our_html = f.read()
    except:
        print(f"  ERROR: Could not read our version")
        continue
    
    # Extract coalition dashboard
    coalition_match = re.search(r'(<section[^>]*id="coalition-dashboard"[^>]*>.*?</section>)', 
                               our_html, re.DOTALL)
    if not coalition_match:
        print(f"  WARNING: No coalition dashboard found")
        continue
    
    coalition_section = coalition_match.group(1)
    
    # Find insertion point
    party_match = re.search(r'(<section[^>]*id="party-dashboard"[^>]*>.*?</section>)', 
                           main_html, re.DOTALL)
    if not party_match:
        print(f"  WARNING: No party dashboard in main")
        continue
    
    # Insert coalition after party
    insert_pos = party_match.end()
    merged_html = main_html[:insert_pos] + '\n\n' + coalition_section + main_html[insert_pos:]
    
    # Add coalition script
    script_match = re.search(r'(<script[^>]*src="[^"]*coalition-dashboard[^"]*"[^>]*>.*?</script>)', 
                            our_html, re.DOTALL)
    if script_match:
        body_pos = merged_html.rfind('</body>')
        if body_pos > 0:
            merged_html = merged_html[:body_pos] + '\n' + script_match.group(1) + '\n\n' + merged_html[body_pos:]
    
    # Write result
    with open(filename, 'w') as f:
        f.write(merged_html)
    
    print(f"  ✓ Merged successfully")

print("\n✓ All language files merged")
