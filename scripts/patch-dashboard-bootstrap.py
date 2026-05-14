#!/usr/bin/env python3
"""patch-dashboard-bootstrap.py

In-place patch that adds the Mermaid + back-to-top + theme-toggle
bootstrap `<script>` block to every committed `dashboards/*.html` page.

Background
----------
`index.html` ships two trailing `<script>` blocks just before `</body>`:

    <!-- Main application entry point -->
    <script type="module" src="/src/browser/main.ts"></script>
    <script>
      (function () {
        function inject(src, isModule) { ... }
        inject('/js/lib/mermaid-init.mjs', true);
        inject('/js/back-to-top.js', true);
        inject('/js/theme-toggle.js', false);
      })();
    </script>

The 9 dashboard pages (× 14 languages = 126 files) historically only
carried the first one. The dark/light-mode toggle button rendered but
had no click handler, and back-to-top was inert. This regression was
introduced by a too-narrow regex in
``scripts/build-dashboard-pages.py`` (`TAIL_SCRIPTS_RE`) which has now
been widened to catch both blocks; this script back-fills the same
bootstrap into the existing committed dashboard files without re-running
the slim-index regeneration that would otherwise touch ``index*.html``.

Idempotent: skips files that already contain the inject block.

Run from the repo root::

    python3 scripts/patch-dashboard-bootstrap.py

Author: Hack23 AB / Riksdagsmonitor
License: Apache-2.0
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DASHBOARDS_DIR = ROOT / 'dashboards'

BOOTSTRAP = '''    <!-- Mermaid + back-to-top + theme toggle bootstrap.
         Imperatively assembled so Vite's HTML transformer does not try to
         bundle / hash / re-emit the underlying modules. -->
    <script>
      (function () {
        function inject(src, isModule) {
          var s = document.createElement('script');
          if (isModule) s.type = 'module';
          else s.defer = true;
          s.src = src;
          document.head.appendChild(s);
        }
        inject('/js/lib/mermaid-init.mjs', true);
        inject('/js/back-to-top.js', true);
        inject('/js/theme-toggle.js', false);
      })();
    </script>
'''

MARKER = "/js/theme-toggle.js"
ENTRY_POINT = '<script type="module" src="/src/browser/main.ts"></script>'


def patch_file(path: Path) -> str:
    """Patch a single dashboard HTML file. Returns one of:
    ``'patched'``, ``'skipped-existing'``, ``'skipped-no-entry'``.
    """
    text = path.read_text(encoding='utf-8')
    if MARKER in text:
        return 'skipped-existing'
    if ENTRY_POINT not in text:
        return 'skipped-no-entry'
    # Insert the bootstrap block immediately after the main entry tag.
    # Preserve any whitespace already following it (typically a blank
    # placeholder line in the current dashboard template).
    needle = ENTRY_POINT
    insertion = f"{needle}\n{BOOTSTRAP}"
    # Avoid duplicating leading whitespace on the inserted line.
    text = text.replace(needle, insertion, 1)
    # If the original file had a blank "placeholder" line right after
    # the entry tag (`    \n`), collapse it.
    text = text.replace(
        f"{ENTRY_POINT}\n{BOOTSTRAP}    \n",
        f"{ENTRY_POINT}\n{BOOTSTRAP}",
    )
    path.write_text(text, encoding='utf-8')
    return 'patched'


def main() -> int:
    if not DASHBOARDS_DIR.is_dir():
        print(f"❌ {DASHBOARDS_DIR} not found", file=sys.stderr)
        return 1
    counts = {'patched': 0, 'skipped-existing': 0, 'skipped-no-entry': 0}
    for html_path in sorted(DASHBOARDS_DIR.glob('*.html')):
        result = patch_file(html_path)
        counts[result] += 1
        if result == 'patched':
            print(f"  ✓ patched {html_path.relative_to(ROOT)}")
        elif result == 'skipped-no-entry':
            print(f"  ⚠ no main.ts entry: {html_path.relative_to(ROOT)}")
    print()
    print(
        f"✅ patched={counts['patched']}, "
        f"skipped-already-present={counts['skipped-existing']}, "
        f"skipped-no-entry={counts['skipped-no-entry']}"
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
