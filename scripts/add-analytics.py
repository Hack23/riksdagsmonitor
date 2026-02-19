#!/usr/bin/env python3
"""
Add Plausible Analytics to all riksdagsmonitor HTML pages.

Inserts:
  1. A `<script defer data-domain="riksdagsmonitor.com" …>` tag just before
     `</head>` in every HTML file (skipping files that already have it).
  2. A `<script src="…/js/plausible-events.js"></script>` tag just before
     `</body>` in every HTML file that does NOT already have it.

The correct relative path for the events script is determined automatically:
  - Files in subdirectories (news/, dashboard/) → `../js/plausible-events.js`
  - Files in the repository root                → `js/plausible-events.js`

Run from the repository root:
    python3 scripts/add-analytics.py
"""

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

PLAUSIBLE_SCRIPT_TAG = (
    '  <!-- Privacy-focused analytics: cookie-free, GDPR-compliant, no consent required -->\n'
    '  <script defer data-domain="riksdagsmonitor.com"'
    ' src="https://plausible.io/js/script.js"></script>\n'
)

# Matches the plausible.io script already present (idempotent guard)
RE_ALREADY_HAS_PLAUSIBLE = re.compile(r'plausible\.io/js/script\.js', re.IGNORECASE)
RE_ALREADY_HAS_EVENTS    = re.compile(r'plausible-events\.js',         re.IGNORECASE)

# HTML files to skip entirely (auto-generated docs, test reports)
SKIP_DIRS = {'docs', 'node_modules', '.git'}


def collect_html_files():
    """Return all .html files that should receive analytics."""
    files = []
    for path in REPO_ROOT.rglob('*.html'):
        # Skip excluded directories
        parts = set(path.relative_to(REPO_ROOT).parts[:-1])
        if parts & SKIP_DIRS:
            continue
        # Skip the docs/ tree (API docs, coverage reports)
        rel = path.relative_to(REPO_ROOT)
        if str(rel).startswith('docs/'):
            continue
        files.append(path)
    return sorted(files)


def events_script_tag(filepath: Path) -> str:
    """Return the correct relative path for plausible-events.js."""
    rel = filepath.relative_to(REPO_ROOT)
    depth = len(rel.parts) - 1  # number of directory levels
    prefix = '../' * depth
    return f'<script src="{prefix}js/plausible-events.js"></script>\n'


def patch_file(filepath: Path) -> bool:
    """
    Patch a single HTML file.  Returns True if the file was modified.
    """
    try:
        content = filepath.read_text(encoding='utf-8')
    except Exception as exc:
        print(f'  SKIP (read error): {filepath.relative_to(REPO_ROOT)}: {exc}')
        return False

    original = content
    tag = events_script_tag(filepath)

    # 1. Insert Plausible loader before </head>
    if not RE_ALREADY_HAS_PLAUSIBLE.search(content):
        content = content.replace('</head>', PLAUSIBLE_SCRIPT_TAG + '</head>', 1)

    # 2. Insert custom events script before </body>
    if not RE_ALREADY_HAS_EVENTS.search(content):
        content = content.replace('</body>', tag + '</body>', 1)

    if content == original:
        return False

    try:
        filepath.write_text(content, encoding='utf-8')
    except Exception as exc:
        print(f'  SKIP (write error): {filepath.relative_to(REPO_ROOT)}: {exc}')
        return False

    return True


def main():
    html_files = collect_html_files()
    print(f'Found {len(html_files)} HTML files to process.\n')

    updated = 0
    skipped = 0

    for filepath in html_files:
        if patch_file(filepath):
            rel = filepath.relative_to(REPO_ROOT)
            print(f'  Updated: {rel}')
            updated += 1
        else:
            skipped += 1

    print(f'\nDone. {updated} files updated, {skipped} already up-to-date.')


if __name__ == '__main__':
    main()
