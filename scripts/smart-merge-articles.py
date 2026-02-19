#!/usr/bin/env python3
"""
Smart Merge Script: Combine comprehensive article content from main with enhanced metadata from current branch

Strategy:
1. For each article file in conflict:
   - Take full article body content from main branch (comprehensive ~4000 words)
   - Extract enhanced titles/metadata from our branch
   - Apply enhanced metadata to main branch content
2. This preserves all improvements from both branches
"""

import subprocess
import re
from pathlib import Path

def get_file_from_branch(filename, branch):
    """Get file content from a specific git branch"""
    try:
        result = subprocess.run(
            ['git', 'show', f'{branch}:{filename}'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError:
        return None

def extract_metadata_section(content):
    """Extract the <head> metadata section from HTML content"""
    match = re.search(r'<head>(.*?)</head>', content, re.DOTALL)
    return match.group(1) if match else None

def extract_h1_title(content):
    """Extract the h1 title from article"""
    match = re.search(r'<h1[^>]*>(.*?)</h1>', content)
    return match.group(1) if match else None

def replace_metadata_section(content, new_metadata):
    """Replace the <head> metadata section in HTML content"""
    return re.sub(
        r'<head>.*?</head>',
        f'<head>{new_metadata}</head>',
        content,
        flags=re.DOTALL
    )

def replace_h1_title(content, new_title):
    """Replace the h1 title in article"""
    if not new_title:
        return content
    return re.sub(
        r'<h1[^>]*>.*?</h1>',
        f'<h1>{new_title}</h1>',
        content
    )

def smart_merge_file(filename):
    """
    Perform smart merge:
    - Take full content from main (THEIRS)
    - Apply enhanced metadata from our branch (OURS)
    """
    # Get content from both branches
    ours_content = get_file_from_branch(filename, 'HEAD')
    theirs_content = get_file_from_branch(filename, 'origin/main')
    
    if not ours_content or not theirs_content:
        print(f"  ⚠️  Skipping {filename} - missing in one branch")
        return None
    
    # Extract enhanced metadata from our branch
    our_metadata = extract_metadata_section(ours_content)
    our_h1 = extract_h1_title(ours_content)
    
    if not our_metadata:
        print(f"  ⚠️  Skipping {filename} - no metadata found in our branch")
        return None
    
    # Take full content from main and apply our enhanced metadata
    merged_content = replace_metadata_section(theirs_content, our_metadata)
    merged_content = replace_h1_title(merged_content, our_h1)
    
    return merged_content

def main():
    """Main execution"""
    print("🔄 Smart Merge: Combining article content from main + enhanced metadata from our branch")
    print("=" * 80)
    
    # Get list of conflicting files from the merge
    result = subprocess.run(
        ['git', 'diff', '--name-only', '--diff-filter=U', 'origin/main'],
        capture_output=True,
        text=True
    )
    
    # If no conflicts found, merge hasn't started - initiate it
    if not result.stdout.strip():
        print("\n📥 Initiating merge with origin/main...")
        subprocess.run(
            ['git', 'merge', 'origin/main', '--no-commit', '--no-ff', '--allow-unrelated-histories'],
            check=False
        )
        
        # Get conflicting files
        result = subprocess.run(
            ['git', 'diff', '--name-only', '--diff-filter=U'],
            capture_output=True,
            text=True
        )
    
    conflicting_files = [f for f in result.stdout.strip().split('\n') if f.endswith('.html') and '/news/' in f]
    
    print(f"\n📊 Found {len(conflicting_files)} HTML files to merge")
    print("-" * 80)
    
    merged_count = 0
    skipped_count = 0
    
    for filename in conflicting_files:
        print(f"\n📄 Processing: {filename}")
        
        merged_content = smart_merge_file(filename)
        
        if merged_content:
            # Write merged content
            filepath = Path(filename)
            filepath.write_text(merged_content, encoding='utf-8')
            
            # Stage the resolved file
            subprocess.run(['git', 'add', filename], check=True)
            
            merged_count += 1
            print(f"  ✅ Merged successfully ({len(merged_content.split())} words)")
        else:
            skipped_count += 1
    
    print("\n" + "=" * 80)
    print(f"✅ Smart merge complete:")
    print(f"   - Merged: {merged_count} files")
    print(f"   - Skipped: {skipped_count} files")
    print("=" * 80)
    
    # Check if any conflicts remain
    result = subprocess.run(
        ['git', 'diff', '--name-only', '--diff-filter=U'],
        capture_output=True,
        text=True
    )
    
    remaining = result.stdout.strip()
    if remaining:
        print(f"\n⚠️  {len(remaining.split())} conflicts remain:")
        for f in remaining.split('\n'):
            print(f"   - {f}")
    else:
        print("\n🎉 All conflicts resolved! Ready to commit.")

if __name__ == '__main__':
    main()
