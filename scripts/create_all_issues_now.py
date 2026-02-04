#!/usr/bin/env python3
"""
Create all 8 riksdagsmonitor GitHub issues using GitHub REST API
PAT is now available via GitHub MCP server
"""

import os
import sys
import re
import json
import time
import requests
from typing import Dict, List, Tuple, Optional

# GitHub API Configuration
GITHUB_API = "https://api.github.com"
REPO_OWNER = "Hack23"
REPO_NAME = "riksdagsmonitor"
ASSIGNEE = "copilot-swe-agent[bot]"

def get_github_token() -> Optional[str]:
    """Get GitHub token from environment variables"""
    # Try multiple possible environment variable names
    token_vars = [
        "GITHUB_TOKEN",
        "GITHUB_PERSONAL_ACCESS_TOKEN", 
        "COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN",
        "GH_TOKEN"
    ]
    
    for var in token_vars:
        token = os.getenv(var)
        if token:
            print(f"✅ Found GitHub token in {var} (length: {len(token)})")
            return token
    
    return None

def parse_issues_from_doc(filename: str) -> List[Dict]:
    """Parse all issues from GITHUB_ISSUES_TO_CREATE.md"""
    print(f"📖 Reading issue documentation from {filename}...")
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by issue sections
    issue_sections = re.split(r'\n## Issue #(\d+):', content)
    
    issues = []
    
    # Process each issue (skip first section which is header)
    for i in range(1, len(issue_sections), 2):
        if i + 1 >= len(issue_sections):
            break
            
        issue_num = issue_sections[i]
        issue_content = issue_sections[i + 1]
        
        # Extract title
        title_match = re.search(r'\*\*Title\*\*:\s*`(.+?)`', issue_content)
        if not title_match:
            print(f"⚠️ Could not find title for Issue #{issue_num}")
            continue
        title = title_match.group(1)
        
        # Extract labels
        labels_match = re.search(r'\*\*Labels\*\*:\s*(.+?)(?:\n|$)', issue_content)
        labels = []
        if labels_match:
            labels_str = labels_match.group(1)
            # Remove backticks and split by comma
            labels = [l.strip().strip('`') for l in labels_str.split(',')]
        
        # Extract body (everything between ```markdown blocks)
        body_match = re.search(r'```markdown\n(.*?)\n```', issue_content, re.DOTALL)
        if not body_match:
            print(f"⚠️ Could not find body for Issue #{issue_num}")
            continue
        body = body_match.group(1)
        
        issues.append({
            "number": int(issue_num),
            "title": title,
            "labels": labels,
            "body": body
        })
        
        print(f"✅ Parsed Issue #{issue_num}: {title[:60]}...")
    
    return issues

def test_github_access(token: str) -> bool:
    """Test if we have GitHub API access"""
    print(f"\n🔍 Testing GitHub API access to {REPO_OWNER}/{REPO_NAME}...")
    
    url = f"{GITHUB_API}/repos/{REPO_OWNER}/{REPO_NAME}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            repo_data = response.json()
            print(f"✅ Access confirmed: {repo_data['full_name']}")
            print(f"   Description: {repo_data.get('description', 'N/A')[:80]}")
            return True
        else:
            print(f"❌ Access failed: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Error testing access: {e}")
        return False

def create_issue(token: str, issue_data: Dict) -> Tuple[bool, str, Optional[str]]:
    """Create a single GitHub issue"""
    url = f"{GITHUB_API}/repos/{REPO_OWNER}/{REPO_NAME}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    
    payload = {
        "title": issue_data["title"],
        "body": issue_data["body"],
        "labels": issue_data["labels"],
        "assignees": [ASSIGNEE]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 201:
            data = response.json()
            return True, data["html_url"], str(data["number"])
        else:
            error_msg = f"HTTP {response.status_code}: {response.text[:300]}"
            return False, error_msg, None
    except Exception as e:
        return False, str(e), None

def main():
    print("="*70)
    print("🚀 Creating 8 GitHub Issues for Riksdagsmonitor")
    print("="*70)
    print()
    
    # Step 1: Get GitHub token
    token = get_github_token()
    if not token:
        print("❌ ERROR: No GitHub token found")
        print("   Tried: GITHUB_TOKEN, GITHUB_PERSONAL_ACCESS_TOKEN, COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN")
        sys.exit(1)
    
    # Step 2: Test GitHub access
    if not test_github_access(token):
        print("❌ ERROR: Cannot access GitHub API")
        sys.exit(1)
    
    # Step 3: Parse issues from documentation
    issues = parse_issues_from_doc("GITHUB_ISSUES_TO_CREATE.md")
    print(f"\n📋 Successfully parsed {len(issues)} issues from documentation")
    
    if len(issues) == 0:
        print("❌ ERROR: No issues found in documentation")
        sys.exit(1)
    
    # Step 4: Create each issue
    print("\n" + "="*70)
    print("Creating Issues")
    print("="*70)
    
    created_issues = []
    failed_issues = []
    
    for issue_data in issues:
        print(f"\n📝 Issue #{issue_data['number']}: {issue_data['title']}")
        print(f"   Labels: {', '.join(issue_data['labels'][:3])}...")
        print(f"   Body: {len(issue_data['body'])} characters")
        
        success, result, issue_num = create_issue(token, issue_data)
        
        if success:
            print(f"   ✅ Created: {result}")
            print(f"   🔢 Issue Number: #{issue_num}")
            created_issues.append({
                "local_num": issue_data['number'],
                "github_num": issue_num,
                "url": result,
                "title": issue_data['title']
            })
        else:
            print(f"   ❌ Failed: {result}")
            failed_issues.append({
                "local_num": issue_data['number'],
                "title": issue_data['title'],
                "error": result
            })
        
        # Rate limiting: wait 2 seconds between issues
        if issue_data != issues[-1]:  # Don't wait after last issue
            time.sleep(2)
    
    # Step 5: Summary
    print("\n" + "="*70)
    print("Summary")
    print("="*70)
    
    print(f"\n✅ Successfully created: {len(created_issues)}/{len(issues)} issues")
    print(f"❌ Failed: {len(failed_issues)}/{len(issues)} issues")
    
    if created_issues:
        print("\n📊 Created Issues:")
        for issue in created_issues:
            print(f"   #{issue['github_num']}: {issue['title'][:60]}")
            print(f"      {issue['url']}")
    
    if failed_issues:
        print("\n⚠️ Failed Issues:")
        for issue in failed_issues:
            print(f"   Issue {issue['local_num']}: {issue['title'][:60]}")
            print(f"      Error: {issue['error'][:100]}")
    
    print("\n" + "="*70)
    print(f"🏁 Done! Created {len(created_issues)} issues")
    print("="*70)
    
    # Save results to file
    results_file = "/tmp/created_issues.json"
    with open(results_file, 'w') as f:
        json.dump({
            "created": created_issues,
            "failed": failed_issues,
            "total": len(issues),
            "success_count": len(created_issues)
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: {results_file}")
    
    return 0 if len(failed_issues) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
