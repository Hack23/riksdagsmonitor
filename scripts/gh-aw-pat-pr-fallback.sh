#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2024-2026 Hack23 AB
# SPDX-License-Identifier: Apache-2.0
#
# gh-aw Host-side PAT PR fallback.
#
# Recovers a sandbox-side `git commit` produced by a news-* agentic workflow
# when the gh-aw safeoutputs MCP `create_pull_request` call failed (typically
# `Error POSTing to endpoint: session not found` after the ~30 min Streamable
# HTTP idle TTL, but also any other safeoutputs failure that leaves the
# committed branch unpublished).
#
# Two recovery paths, evaluated in order:
#
#   1. Primary — positive bundle handoff (preferred).
#        Stage E in .github/prompts/07-commit-and-pr.md mandates that the
#        agent, immediately after `git commit`, writes:
#            /tmp/gh-aw/aw-fallback.bundle        (git bundle create … "$BRANCH" --not main)
#            /tmp/gh-aw/agent/aw-fallback.json    (branch, sha, slug, title, body, …)
#        The bundle path is matched by the gh-aw artifact upload glob
#        `aw-*.bundle`. The manifest is **not** matched by `aw-*.json`
#        (no such glob exists in the compiled news-*.lock.yml upload step) —
#        but the entire `/tmp/gh-aw/agent/` directory is uploaded recursively,
#        so writing the manifest inside it guarantees it reaches the host job.
#        The host job downloads the artifact, fetches the bundle into the host
#        checkout, runs fail-closed safety gates (default-branch refusal +
#        protected-paths diff scan), and force-with-leases the branch to
#        origin under the host PAT.
#        For backwards compatibility, the consumer also probes the legacy
#        location `/tmp/gh-aw/aw-fallback.json` if the manifest is not at the
#        primary location.
#
#   2. Secondary — legacy dirty-workspace recovery (kept for compatibility).
#        Triggered when no bundle is present but the agent stdio log contains
#        `session not found` AND there are uncommitted changes (or an
#        `aw-*.patch` to apply). Stages only `analysis/daily/**` + `news/**`.
#
# Failure semantics: the job is GREEN only when a PR was successfully created
# or already existed for the target branch. Any other outcome (push failure,
# malformed manifest, missing PAT scopes, gh pr create error) exits non-zero
# so the job fails loudly. The earlier "silent green-exit" failure mode that
# masked run 25028873034 in euparliamentmonitor is eliminated.
#
# Required env (set by the calling workflow):
#   GH_AW_PAT_PR_FALLBACK_TOKEN  PAT with `contents:write,pull_requests:write`
#                                (falls back to GH_TOKEN if unset)
#   GH_AW_PAT_FALLBACK_SLUG      Article slug (e.g. `week-in-review`)
#   GH_AW_PAT_FALLBACK_RUN_URL   URL of the agent run that produced the bundle
#   GH_AW_PAT_FALLBACK_WORKFLOW_NAME  Human-readable workflow name
#   GH_AW_PAT_FALLBACK_SOURCE_RUN_ID  Original agent run ID (for recovery branch names)
#   GITHUB_REPOSITORY, GITHUB_SERVER_URL, GITHUB_RUN_ID  (set by Actions)
#
# Optional env:
#   GH_AW_PAT_FALLBACK_BUNDLE   Override path (default /tmp/gh-aw/aw-fallback.bundle,
#                                falling back to /tmp/gh-aw/aw-main.bundle)
#   GH_AW_PAT_FALLBACK_MANIFEST Override path (default /tmp/gh-aw/aw-fallback.json)
#   GH_AW_PAT_FALLBACK_STDIO_LOG Override path (default /tmp/gh-aw/agent-stdio.log)
#   GH_AW_PAT_FALLBACK_AUDIT_LOG Override path (default /tmp/gh-aw/fallback-events.jsonl)
#   GH_AW_PAT_FALLBACK_SAFEOUTPUTS_FILE  Override safeoutputs.jsonl path
#   GH_AW_PAT_FALLBACK_DRY_RUN   When `1`, skip remote push and `gh pr create`
#                                (used by tests).
#

set -euo pipefail

log() {
  printf 'gh-aw-pat-pr-fallback: %s\n' "$*" >&2
}

die() {
  log "ERROR: $*"
  audit "error" "$1" "${2:-}"
  exit 1
}

step_summary() {
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ] && [ -w "$(dirname "${GITHUB_STEP_SUMMARY}")" ] 2>/dev/null; then
    printf '%s\n' "$*" >> "$GITHUB_STEP_SUMMARY"
  fi
}

audit() {
  # OTLP-shaped JSON event; one event per line.
  local event="$1"
  local message="${2:-}"
  local extra="${3:-}"
  local audit_log="${GH_AW_PAT_FALLBACK_AUDIT_LOG:-/tmp/gh-aw/fallback-events.jsonl}"
  mkdir -p "$(dirname "$audit_log")" 2>/dev/null || true
  local ts
  ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  node - "$ts" "$event" "$message" "$extra" \
    "${GH_AW_PAT_FALLBACK_SLUG:-}" "${GH_AW_PAT_FALLBACK_WORKFLOW_NAME:-}" \
    "${GITHUB_RUN_ID:-}" "${GITHUB_REPOSITORY:-}" \
    >> "$audit_log" 2>/dev/null <<'NODE_AUDIT' || true
const [, , ts, event, message, extra, slug, wf, run, repo] = process.argv;
const payload = { ts, event, slug, workflow: wf, run_id: run, repo };
if (message) payload.message = message;
if (extra) {
  try { Object.assign(payload, JSON.parse(extra)); }
  catch { payload.extra = extra; }
}
process.stdout.write(JSON.stringify(payload) + '\n');
NODE_AUDIT
}

mask_token() {
  local tok="$1"
  if [ -n "$tok" ]; then
    printf '::add-mask::%s\n' "$tok"
  fi
}

read_manifest_field() {
  # read_manifest_field <manifest-path> <field-name>
  node - "$1" "$2" <<'NODE_FIELD'
const fs = require('fs');
const [, , path, field] = process.argv;
try {
  const m = JSON.parse(fs.readFileSync(path, 'utf8'));
  const v = m[field];
  if (v === undefined || v === null) process.stdout.write('');
  else if (typeof v === 'string') process.stdout.write(v);
  else process.stdout.write(JSON.stringify(v));
} catch (e) {
  process.exit(2);
}
NODE_FIELD
}

primary_branch_from_bundle() {
  # Extract the (single) branch ref from a git bundle.
  git bundle list-heads "$1" 2>/dev/null | awk 'NR==1 {print $2}' | sed 's|^refs/heads/||'
}

# ---------------------------------------------------------------------------
# Trigger evaluation
# ---------------------------------------------------------------------------

bundle="${GH_AW_PAT_FALLBACK_BUNDLE:-}"
if [ -z "$bundle" ]; then
  for cand in /tmp/gh-aw/aw-fallback.bundle /tmp/gh-aw/aw-main.bundle; do
    if [ -f "$cand" ]; then
      bundle="$cand"
      break
    fi
  done
  [ -n "$bundle" ] || bundle="/tmp/gh-aw/aw-fallback.bundle"
fi
# The gh-aw `agent` artifact upload glob in compiled news-*.lock.yml only
# matches `/tmp/gh-aw/aw-*.bundle` and `/tmp/gh-aw/aw-*.patch` (no `aw-*.json`),
# but the entire `/tmp/gh-aw/agent/` directory is uploaded recursively. Stage E
# in `.github/prompts/07-commit-and-pr.md` therefore writes the manifest at
# `/tmp/gh-aw/agent/aw-fallback.json` so it reaches the host job. We probe both
# locations here for backwards compatibility with older agent runs.
manifest="${GH_AW_PAT_FALLBACK_MANIFEST:-}"
if [ -z "$manifest" ]; then
  manifest_primary="${GH_AW_PAT_FALLBACK_MANIFEST_PRIMARY:-/tmp/gh-aw/agent/aw-fallback.json}"
  manifest_legacy="${GH_AW_PAT_FALLBACK_MANIFEST_LEGACY:-/tmp/gh-aw/aw-fallback.json}"
  for cand in "$manifest_primary" "$manifest_legacy"; do
    if [ -f "$cand" ]; then
      manifest="$cand"
      break
    fi
  done
  [ -n "$manifest" ] || manifest="$manifest_primary"
fi
stdio_log="${GH_AW_PAT_FALLBACK_STDIO_LOG:-/tmp/gh-aw/agent-stdio.log}"
safeoutputs_file="${GH_AW_PAT_FALLBACK_SAFEOUTPUTS_FILE:-${GH_AW_SAFE_OUTPUTS:-/tmp/gh-aw/safeoutputs.jsonl}}"

# Default branch detection — used both for the `git pr create --base` target
# and for the protected-branch safety check below.
default_branch="${DEFAULT_BRANCH:-main}"

# A successful safeoutputs PR creation writes a `create_pull_request` event to
# safeoutputs.jsonl and the triggering workflow concludes successfully. Failed
# safeoutputs runs also leave the attempted request in safeoutputs.jsonl, so use
# the workflow conclusion as the success discriminator before skipping.
trigger_conclusion="${GH_AW_PAT_FALLBACK_TRIGGER_CONCLUSION:-}"
if [ "$trigger_conclusion" = "success" ] \
  && [ -f "$safeoutputs_file" ] \
  && grep -q '"create_pull_request"' "$safeoutputs_file"; then
  log "safeoutputs already produced a create_pull_request event; fallback skipped"
  step_summary "✅ Host-side PAT PR fallback skipped — safeoutputs PR already created."
  audit "skip" "safeoutputs PR already created"
  exit 0
fi

primary_active=0
secondary_active=0
if [ -f "$manifest" ] && [ -f "$bundle" ]; then
  primary_active=1
  log "primary path active — manifest + bundle present"
elif [ -f "$bundle" ]; then
  primary_active=1
  log "primary path active — bundle only (will derive metadata)"
elif [ -f "$stdio_log" ] && grep -qi 'session not found' "$stdio_log"; then
  secondary_active=1
  log "secondary path active — session not found detected, no bundle"
fi

if [ "$primary_active" -eq 0 ] && [ "$secondary_active" -eq 0 ]; then
  log "no fallback handoff present; nothing to do"
  step_summary "ℹ️ Host-side PAT PR fallback not triggered — no bundle, no session-not-found marker."
  audit "noop" "no handoff and no session-not-found"
  exit 0
fi

# ---------------------------------------------------------------------------
# Token + scope validation (fail closed)
# ---------------------------------------------------------------------------

token=""
if [ -n "${GH_AW_PAT_PR_FALLBACK_TOKEN:-}" ]; then
  token="$GH_AW_PAT_PR_FALLBACK_TOKEN"
elif [ -n "${GH_TOKEN:-}" ]; then
  token="$GH_TOKEN"
fi

if [ -z "$token" ]; then
  step_summary "❌ Host-side PAT PR fallback failed — no token available."
  die "no fallback token available"
fi

mask_token "$token"
export GH_TOKEN="$token"

repo=""
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
  repo="$GITHUB_REPOSITORY"
else
  step_summary "❌ Host-side PAT PR fallback failed — GITHUB_REPOSITORY unavailable."
  die "GITHUB_REPOSITORY unavailable"
fi

server_url="${GITHUB_SERVER_URL:-https://github.com}"
case "$server_url" in
  http://*|https://*) ;;
  *)
    step_summary "❌ Host-side PAT PR fallback failed — GITHUB_SERVER_URL must include scheme."
    die "GITHUB_SERVER_URL must include http:// or https://"
    ;;
esac
server_host="${server_url#https://}"
server_host="${server_host#http://}"

if [ "${GH_AW_PAT_FALLBACK_DRY_RUN:-0}" != "1" ]; then
  # Probe: does the PAT have write access to this repo?
  if ! gh auth status >/dev/null 2>&1; then
    step_summary "❌ Host-side PAT PR fallback failed — \`gh auth status\` rejected the supplied token."
    die "gh auth status failed; PAT not authenticated"
  fi
  perms_json=$(gh api "/repos/$repo" --jq '{push: .permissions.push, pull: .permissions.pull, admin: .permissions.admin}' 2>/dev/null || true)
  if [ -z "$perms_json" ]; then
    step_summary "⚠️ Host-side PAT PR fallback — could not query repo permissions; proceeding optimistically."
    audit "warn" "permission probe returned empty"
  else
    push=$(printf '%s' "$perms_json" | node -e 'let s=""; process.stdin.on("data",c=>s+=c).on("end",()=>{ try { const o=JSON.parse(s); process.stdout.write(o.push?"true":"false"); } catch { process.stdout.write("unknown"); }})')
    if [ "$push" != "true" ]; then
      step_summary "❌ Host-side PAT PR fallback failed — token lacks contents:write on $repo."
      die "PAT lacks push permission" "$perms_json"
    fi
  fi
fi

git config --global user.email "github-actions[bot]@users.noreply.github.com"
git config --global user.name "github-actions[bot]"
git config --global advice.defaultBranchName false

# ---------------------------------------------------------------------------
# Primary path — bundle handoff
# ---------------------------------------------------------------------------

if [ "$primary_active" -eq 1 ]; then
  branch=""
  head_sha=""
  parent_sha=""
  slug="${GH_AW_PAT_FALLBACK_SLUG:-}"
  today="${TODAY:-}"
  analysis_dir=""
  article_md_path=""
  title=""
  body_summary=""
  gate_result="UNKNOWN"

  if [ -f "$manifest" ]; then
    if ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$manifest" >/dev/null 2>&1; then
      step_summary "❌ Host-side PAT PR fallback failed — manifest is not valid JSON."
      die "aw-fallback.json is not valid JSON"
    fi
    branch=$(read_manifest_field "$manifest" branch || true)
    head_sha=$(read_manifest_field "$manifest" head_sha || true)
    parent_sha=$(read_manifest_field "$manifest" parent_sha || true)
    [ -n "$slug" ] || slug=$(read_manifest_field "$manifest" slug || true)
    today=$(read_manifest_field "$manifest" today || true)
    analysis_dir=$(read_manifest_field "$manifest" analysis_dir || true)
    article_md_path=$(read_manifest_field "$manifest" article_md_path || true)
    title=$(read_manifest_field "$manifest" title || true)
    body_summary=$(read_manifest_field "$manifest" body_summary || true)
    gate_result=$(read_manifest_field "$manifest" gate_result || true)
    [ -n "$gate_result" ] || gate_result="UNKNOWN"
  fi

  # If manifest didn't supply a branch, derive it from the bundle.
  if [ -z "$branch" ]; then
    branch=$(primary_branch_from_bundle "$bundle" || true)
  fi

  if [ -z "$branch" ]; then
    step_summary "❌ Host-side PAT PR fallback failed — could not determine branch name from manifest or bundle."
    die "branch name unavailable in manifest or bundle"
  fi

  # Derive title from article markdown when manifest didn't carry one.
  if [ -z "$title" ] && [ -n "$article_md_path" ] && [ -f "$article_md_path" ]; then
    title=$(awk '/^# / { sub(/^# /, ""); print; exit }' "$article_md_path")
  fi
  if [ -z "$today" ]; then
    today=$(date -u +%Y-%m-%d)
  fi
  if [ -z "$title" ]; then
    if [ -n "$slug" ] && [ -n "$today" ]; then
      title="news: $slug — $today (host-side fallback)"
    else
      title="news: ${GH_AW_PAT_FALLBACK_SLUG:-recovery} — $(date -u +%Y-%m-%d) (host-side fallback)"
    fi
  fi
  # Canonical type → emoji map (mirrors .github/prompts/07-commit-and-pr.md §Article-type emoji table).
  # Any of these prefixes (or the legacy `[news]` prefix) is left alone; otherwise the type-emoji is
  # prepended so the host-fallback PR title matches the title safeoutputs would have written.
  type_emoji_for_slug() {
    case "$1" in
      propositions)                        printf '📜' ;;
      motions)                             printf '📝' ;;
      committee-reports)                   printf '🏛️' ;;
      interpellations)                     printf '🗣️' ;;
      evening-analysis)                    printf '🌙' ;;
      week-ahead|month-ahead|quarter-ahead|year-ahead) printf '📅' ;;
      election-cycle)                      printf '🗳️' ;;
      week-in-review|monthly-review)       printf '🔍' ;;
      realtime-pulse)                      printf '📡' ;;
      translate)                           printf '🌐' ;;
      *)                                   printf '📰' ;;
    esac
  }
  type_emoji=$(type_emoji_for_slug "${slug:-}")
  case "$title" in
    "[news]"*|"📰 "*|"📜 "*|"📝 "*|"🏛️ "*|"🗣️ "*|"🌙 "*|"📅 "*|"🗳️ "*|"🔍 "*|"📡 "*|"🌐 "*) ;;
    *) title="${type_emoji} ${title}" ;;
  esac

  log "primary handoff: branch=$branch head=$head_sha parent=$parent_sha"
  audit "primary_start" "bundle handoff" \
    "$(printf '{"branch":"%s","head":"%s","parent":"%s","gate":"%s"}' "$branch" "$head_sha" "$parent_sha" "$gate_result")"

  # Fetch bundle into the host checkout. We map all heads in the bundle into
  # refs/aw-fallback/* to avoid clobbering any local branch.
  if ! git fetch "$bundle" "+refs/heads/*:refs/aw-fallback/*"; then
    step_summary "❌ Host-side PAT PR fallback failed — \`git fetch\` from bundle failed."
    die "git fetch from bundle failed"
  fi

  recovered_ref="refs/aw-fallback/$branch"
  if ! git rev-parse --verify --quiet "$recovered_ref" >/dev/null; then
    # Some bundles only carry one head — try the first.
    only_ref=$(git for-each-ref --format='%(refname)' refs/aw-fallback/ | head -n 1 || true)
    if [ -n "$only_ref" ]; then
      recovered_ref="$only_ref"
      branch="${only_ref#refs/aw-fallback/}"
      log "branch from manifest not in bundle; using sole bundle head $branch"
    else
      step_summary "❌ Host-side PAT PR fallback failed — bundle contains no branch heads."
      die "bundle contains no branch heads"
    fi
  fi

  recovered_sha=$(git rev-parse "$recovered_ref")
  if [ -n "$head_sha" ] && [ "$head_sha" != "$recovered_sha" ]; then
    log "warning: manifest head_sha=$head_sha differs from bundle head=$recovered_sha — trusting bundle"
    audit "warn" "manifest/bundle head mismatch" \
      "$(printf '{"manifest_head":"%s","bundle_head":"%s"}' "$head_sha" "$recovered_sha")"
  fi

  if [ "$branch" = "$default_branch" ] && [ "${bundle##*/}" = "aw-main.bundle" ]; then
    safe_slug="${slug:-recovery}"
    safe_slug=$(printf '%s' "$safe_slug" | tr -cs 'A-Za-z0-9._/-' '-' | sed -E 's#^-+|-+$##g')
    [ -n "$safe_slug" ] || safe_slug="recovery"
    recovery_run_id="${GH_AW_PAT_FALLBACK_SOURCE_RUN_ID:-${GITHUB_RUN_ID:-manual}}"
    branch="news/${today}-${safe_slug}-run-${recovery_run_id}"
    log "bundle carries default-branch ref from safeoutputs handoff; publishing as recovery branch $branch"
    audit "warn" "safeoutputs aw-main bundle ref renamed for recovery" \
      "$(printf '{"branch":"%s","bundle_ref":"%s"}' "$branch" "$default_branch")"
  fi

  # ---- Fail-closed safety checks before any push ----
  # (a) Refuse to push to the default branch — agent should never have
  #     committed there, and even if the bundle carries main→main, the host
  #     fallback must not silently overwrite it.
  case "$branch" in
    "$default_branch"|main|master|develop|trunk|production|release)
      step_summary "❌ Host-side PAT PR fallback refused — recovered branch \`$branch\` is a protected/default branch."
      die "refusing to push to protected branch '$branch'" \
        "$(printf '{"branch":"%s","default":"%s"}' "$branch" "$default_branch")"
      ;;
  esac

  # (b) Reject diffs touching protected paths. We compute the diff between the
  #     recovered tip and its merge-base with the local default branch. The
  #     host job uses `fetch-depth: 0` so origin/$default_branch contains full
  #     history; if merge-base still cannot be resolved (e.g. detached or
  #     malformed checkout), this is the most important fail-closed check, so
  #     we deepen aggressively before giving up — and exit non-zero rather
  #     than skipping the gate.
  protected_re='^(\.github/|\.agents/|package(-lock)?\.json$|pnpm-lock\.yaml$|yarn\.lock$|Gemfile\.lock$|node_modules/|dist/|build/|cypress\.config\..+|tsconfig.*\.json$|vite\.config\..+|vitest\.config\..+)'
  base_sha=""
  resolve_base() {
    if git rev-parse --verify --quiet "origin/$default_branch" >/dev/null 2>&1; then
      git merge-base "origin/$default_branch" "$recovered_sha" 2>/dev/null || true
    elif git rev-parse --verify --quiet "$default_branch" >/dev/null 2>&1; then
      git merge-base "$default_branch" "$recovered_sha" 2>/dev/null || true
    fi
  }
  base_sha=$(resolve_base)
  if [ -z "$base_sha" ]; then
    log "merge-base unresolved; deepening origin/$default_branch and retrying"
    git fetch --no-tags --quiet --depth=200 origin "$default_branch" 2>/dev/null || true
    base_sha=$(resolve_base)
  fi
  if [ -z "$base_sha" ]; then
    log "merge-base still unresolved; unshallowing origin/$default_branch"
    git fetch --no-tags --quiet --unshallow origin "$default_branch" 2>/dev/null \
      || git fetch --no-tags --quiet origin "$default_branch" 2>/dev/null || true
    base_sha=$(resolve_base)
  fi
  if [ -z "$base_sha" ]; then
    step_summary "❌ Host-side PAT PR fallback refused — could not resolve merge-base with \`$default_branch\` to run the protected-paths gate."
    die "merge-base with $default_branch unresolved; refusing to push without protected-paths gate" \
      "$(printf '{"branch":"%s","default":"%s"}' "$branch" "$default_branch")"
  fi
  bad_paths=$(git diff --name-only "$base_sha".."$recovered_sha" | grep -E "$protected_re" || true)
  if [ -n "$bad_paths" ]; then
    log "recovered commit touches protected paths:"
    printf '  %s\n' "$bad_paths" >&2
    step_summary "❌ Host-side PAT PR fallback refused — recovered commit modifies protected paths:"
    step_summary '```'
    step_summary "$bad_paths"
    step_summary '```'
    die "recovered commit touches protected paths" \
      "$(printf '{"branch":"%s","files":%s}' "$branch" \
        "$(printf '%s' "$bad_paths" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>process.stdout.write(JSON.stringify(s.split(/\n/).filter(Boolean))))')")"
  fi

  # Compose body — mirrors the canonical PR body in
  # .github/prompts/07-commit-and-pr.md §"Canonical PR body template" so reviewers
  # navigate fallback PRs by the same section icons as primary safeoutputs PRs.
  # Sections that the host job cannot populate from the manifest render `_None — host
  # fallback path (see analysis dir on the branch)._` so the structure stays stable.
  body_file=$(mktemp)
  trap 'rm -f "$body_file"' EXIT
  workflow_name="${GH_AW_PAT_FALLBACK_WORKFLOW_NAME:-${slug:-news}}"
  run_url="${GH_AW_PAT_FALLBACK_RUN_URL:-$server_url/$repo/actions/runs/${GITHUB_RUN_ID:-unknown}}"
  workflow_file=""
  if [ -n "${slug:-}" ]; then
    workflow_file="news-${slug}.lock.yml"
  fi
  {
    cat <<EOF_BANNER
> 🛟 **Host-side PAT fallback PR.** The agent committed inside the gh-aw sandbox
> but the safeoutputs MCP \`create_pull_request\` call failed (typically a
> \`session not found\` after the ~30 min Streamable-HTTP idle TTL). The host
> job replayed the agent commit from a portable git bundle and opened this PR
> under the repo PAT. The fallback never modifies the working tree of the host
> runner — it pushes the bundle commit verbatim with \`--force-with-lease\`
> after fail-closed gates (refuse-protected-branch + reject-protected-paths).

| Field | Value |
|-------|-------|
| Workflow | \`$workflow_name\` |
| Article type | \`${slug:-?}\` |
| Article date | \`${today:-?}\` |
| Languages | host-fallback path — see analysis dir on the branch |
| Analysis depth | host-fallback path — see analysis dir on the branch |
| Iteration mode | host-fallback path — see analysis dir on the branch |
| Gate verdict | \`${gate_result}\` |
| Agent run | $run_url |
| Branch | \`$branch\` |
| Head SHA | \`$recovered_sha\` |
| Analysis dir | \`${analysis_dir:-?}\` |
| Recovery path | primary (bundle handoff) |

## 📋 Summary

EOF_BANNER
    if [ -n "$body_summary" ]; then
      printf '%s\n\n' "$body_summary"
    else
      # shellcheck disable=SC2016 # literal markdown backticks in the format string
      printf '_Host-fallback PR for \`%s\` on \`%s\`. See analysis dir on the branch for the full BLUF and section content; the agent commit was replayed verbatim from the sandbox bundle._\n\n' "${slug:-?}" "${today:-?}"
    fi
    cat <<EOF_SECTIONS
### 📊 Stats

| Metric | Value |
|--------|-------|
| Recovery source | bundle handoff |
| Recovered SHA | \`$recovered_sha\` |
| Parent SHA | \`${parent_sha:-?}\` |
| Gate verdict | \`${gate_result}\` |

## 🧠 Analysis artifacts

_See \`${analysis_dir:-analysis/daily/${today}/${slug}}/\` on this branch — the host fallback replays the agent's commit verbatim, so every artifact the agent staged (summaries, SWOT, risk, threat, stakeholder, significance, classification, cross-reference, manifest, documents/) is present at \`$recovered_sha\`._

## 🌐 Localized articles

_See \`news/${today}-${slug}-*.html\` on this branch — present iff the agent ran the renderer before the safeoutputs MCP failure. Improvement-mode re-runs always re-render; first-pass failures before the renderer ran will land without HTML._

## 🔗 Top source citations

_Not extractable host-side. See \`${analysis_dir:-analysis/daily/${today}/${slug}}/article.md\` (top citations) and \`documents/\` (per-\`dok_id\` analysis) on this branch._

## 🔍 Methodology & compliance

- **Methodology**: \`analysis/methodologies/ai-driven-analysis-guide.md\`
- **Templates**: \`analysis/templates/\`
- **Evidence rule**: every claim cites a \`dok_id\`, named actor, vote count, or primary-source URL.
- **GDPR / ISMS**: public-source data only; neutrality applied; DPIA not required.

## 🔁 Iteration

_Host-fallback path: see \`${analysis_dir:-analysis/daily/${today}/${slug}}/methodology-reflection.md\` on this branch for Pass 1 / Pass 2 / aggregate-render status (the rerun-log marker is appended on every improvement-mode run)._

## ⚠️ Caveats & limits

- This PR was opened by the host-side PAT fallback after \`safeoutputs___create_pull_request\` failed inside the agent sandbox. Treat the agent's MCP transcript as incomplete past the failure point.
- The fallback runs fail-closed protected-paths and refuse-default-branch gates before push; this PR's diff is guaranteed to exclude \`.github/\`, \`.agents/\`, \`package.json\`, lock files, and build configs.
- Manifest-derived fields above reflect what the agent wrote to \`/tmp/gh-aw/agent/aw-fallback.json\` before the MCP failure — any divergence from the actual commit content should be reconciled against the on-disk artifacts on this branch.

## ▶️ Re-run

\`\`\`bash
gh aw run ${workflow_file:-news-<workflow>.lock.yml} --ref main \\
  -F article_date=${today:-YYYY-MM-DD}
\`\`\`
EOF_SECTIONS
  } > "$body_file"

  if [ "${GH_AW_PAT_FALLBACK_DRY_RUN:-0}" = "1" ]; then
    log "dry run: would push $recovered_ref → refs/heads/$branch on $server_host/$repo"
    log "dry run: would open PR titled '$title'"
    step_summary "🧪 Host-side PAT PR fallback dry run completed for branch \`$branch\`."
    audit "dry_run_success" "primary path" \
      "$(printf '{"branch":"%s","title":%s}' "$branch" "$(printf '%s' "$title" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>process.stdout.write(JSON.stringify(s.trim())))')")"
    exit 0
  fi

  # Pre-flight: if safeoutputs already opened the PR and the remote branch
  # already points at the recovered SHA, the primary path succeeded — exit
  # without pushing or editing so we never clobber the safeoutputs-authored
  # title/body on a successful run. This is the fix for the "PAT fallback
  # fires even when main hasn't changed" symptom (investigation Finding 3).
  preflight_pr=$(gh pr list --repo "$repo" --head "$branch" --state open --json number,url,headRefOid --jq '.[0]' 2>/dev/null || true)
  if [ -n "$preflight_pr" ] && [ "$preflight_pr" != "null" ]; then
    preflight_number=$(printf '%s' "$preflight_pr" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o=JSON.parse(s);process.stdout.write(String(o.number));})')
    preflight_url=$(printf '%s' "$preflight_pr" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o=JSON.parse(s);process.stdout.write(o.url);})')
    preflight_oid=$(printf '%s' "$preflight_pr" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o=JSON.parse(s);process.stdout.write(o.headRefOid||"");})')
    if [ -n "$preflight_oid" ] && [ "$preflight_oid" = "$recovered_sha" ]; then
      log "preflight: safeoutputs already opened PR #$preflight_number at recovered SHA $recovered_sha — fallback is a no-op"
      echo "::notice title=PAT fallback no-op::safeoutputs primary path succeeded for branch $branch (PR #$preflight_number at $recovered_sha). Fallback skipped to avoid clobbering safeoutputs-authored PR metadata."
      step_summary "🟢 Host-side PAT PR fallback skipped — safeoutputs primary path succeeded ([PR #$preflight_number]($preflight_url) at \`$recovered_sha\`)."
      audit "primary_noop_safeoutputs_succeeded" "preflight matched recovered SHA" \
        "$(printf '{"branch":"%s","pr":%s,"url":"%s","head_sha":"%s"}' "$branch" "$preflight_number" "$preflight_url" "$recovered_sha")"
      exit 0
    fi
    log "preflight: open PR #$preflight_number exists for $branch but head ($preflight_oid) differs from recovered ($recovered_sha) — proceeding with bundle replay"
  fi

  push_url="https://x-access-token:${token}@${server_host}/${repo}.git"
  if ! git push --force-with-lease "$push_url" "$recovered_ref:refs/heads/$branch" 2>&1; then
    step_summary "❌ Host-side PAT PR fallback failed — \`git push\` rejected (force-with-lease conflict or auth)."
    die "git push of recovered branch failed"
  fi

  existing_pr=$(gh pr list --repo "$repo" --head "$branch" --state open --json number,url --jq '.[0]' 2>/dev/null || true)
  if [ -n "$existing_pr" ] && [ "$existing_pr" != "null" ]; then
    pr_number=$(printf '%s' "$existing_pr" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o=JSON.parse(s);process.stdout.write(String(o.number));})')
    pr_url=$(printf '%s' "$existing_pr" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o=JSON.parse(s);process.stdout.write(o.url);})')
    log "open PR #$pr_number already exists for $branch — refreshing title/body"
    if ! gh pr edit "$pr_number" --repo "$repo" --title "$title" --body-file "$body_file"; then
      step_summary "❌ Host-side PAT PR fallback failed — could not update existing PR #$pr_number."
      die "gh pr edit failed for #$pr_number"
    fi
    step_summary "✅ Host-side PAT PR fallback updated existing PR [#$pr_number]($pr_url) for branch \`$branch\`."
    audit "primary_updated" "existing PR refreshed" \
      "$(printf '{"branch":"%s","pr":%s,"url":"%s"}' "$branch" "$pr_number" "$pr_url")"
    exit 0
  fi

  base_branch="$default_branch"
  if ! pr_url=$(gh pr create \
      --repo "$repo" \
      --base "$base_branch" \
      --head "$branch" \
      --title "$title" \
      --body-file "$body_file" 2>&1); then
    step_summary "❌ Host-side PAT PR fallback failed — \`gh pr create\` errored: $pr_url"
    die "gh pr create failed" "$(printf '{"err":%s}' "$(printf '%s' "$pr_url" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>process.stdout.write(JSON.stringify(s.trim())))')")"
  fi
  step_summary "✅ Host-side PAT PR fallback created PR $pr_url for branch \`$branch\`."
  audit "primary_created" "$pr_url" \
    "$(printf '{"branch":"%s","title":%s}' "$branch" "$(printf '%s' "$title" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>process.stdout.write(JSON.stringify(s.trim())))')")"
  exit 0
fi

# ---------------------------------------------------------------------------
# Secondary path — legacy dirty-workspace recovery
# ---------------------------------------------------------------------------

log "secondary path: dirty-workspace recovery"
audit "secondary_start" "legacy dirty-workspace path"

slug="${GH_AW_PAT_FALLBACK_SLUG:-${ARTICLE_TYPE_SLUG:-}}"
if [ -z "$slug" ]; then
  step_summary "❌ Host-side PAT PR fallback failed — no slug provided for secondary path."
  die "article slug unavailable in secondary path"
fi
today="${TODAY:-$(date -u +%Y-%m-%d)}"
branch="news/$today-$slug-recovery-${GITHUB_RUN_ID:-manual}"

all_changed=$(mktemp)
eligible_changed=$(mktemp)
disallowed_changed=$(mktemp)
trap 'rm -f "$all_changed" "$eligible_changed" "$disallowed_changed"' EXIT

if [ -z "$(git status --porcelain)" ]; then
  for patch_file in /tmp/gh-aw/aw-*.patch; do
    [ -e "$patch_file" ] || continue
    log "applying agent patch artifact $patch_file"
    if git apply --whitespace=nowarn "$patch_file"; then
      break
    fi
    log "patch artifact did not apply cleanly: $patch_file"
  done
fi

git diff --name-only > "$all_changed"
git ls-files --others --exclude-standard >> "$all_changed"
sort -u "$all_changed" -o "$all_changed"

while IFS= read -r file; do
  [ -z "$file" ] && continue
  case "$file" in
    analysis/daily/*|news/*)
      case "$file" in
        *.lock|.github/workflows/*.lock.yml|.github/*|node_modules/*)
          printf '%s\n' "$file" >> "$disallowed_changed" ;;
        *)
          printf '%s\n' "$file" >> "$eligible_changed" ;;
      esac
      ;;
    *)
      printf '%s\n' "$file" >> "$disallowed_changed" ;;
  esac
done < "$all_changed"

if [ ! -s "$eligible_changed" ]; then
  log "secondary path: no eligible analysis/news changes found; treating as no-op"
  step_summary "ℹ️ Host-side PAT PR fallback (secondary) — no eligible changes; treated as no-op."
  audit "secondary_noop" "no eligible files"
  exit 0
fi

if [ -s "$disallowed_changed" ]; then
  log "secondary path: leaving non-eligible workspace changes unstaged:"
  sed 's/^/  - /' "$disallowed_changed" >&2
fi

git remote set-url origin "https://x-access-token:${token}@${server_host}/${repo}.git" 2>/dev/null || true
git checkout -B "$branch"
git reset --mixed --quiet

while IFS= read -r file; do
  git add -A -- "$file"
done < "$eligible_changed"

if git diff --cached --quiet; then
  log "secondary path: staged diff is empty after add"
  step_summary "ℹ️ Host-side PAT PR fallback (secondary) — staged diff empty; no-op."
  audit "secondary_noop" "empty staged diff"
  exit 0
fi

git commit -m "news(secondary fallback): publish $slug $today"

if [ "${GH_AW_PAT_FALLBACK_DRY_RUN:-0}" = "1" ]; then
  log "dry run: secondary path would push origin $branch and open PR"
  step_summary "🧪 Host-side PAT PR fallback (secondary) dry run completed for \`$branch\`."
  audit "dry_run_success" "secondary path" "$(printf '{"branch":"%s"}' "$branch")"
  exit 0
fi

if ! git push --force-with-lease origin "$branch"; then
  step_summary "❌ Host-side PAT PR fallback (secondary) failed — \`git push\` rejected."
  die "secondary path: git push failed"
fi

run_url="${GH_AW_PAT_FALLBACK_RUN_URL:-$server_url/$repo/actions/runs/${GITHUB_RUN_ID:-unknown}}"
title="📰 [news fallback] $slug — $today"
body=$(printf 'Host-side PAT fallback (secondary path) created this PR after a sandbox safeoutputs failure for %s.\n\nAgent run: %s\n' "$slug" "$run_url")

existing_pr=$(gh pr list --repo "$repo" --head "$branch" --state open --json number,url --jq '.[0]' 2>/dev/null || true)
if [ -n "$existing_pr" ] && [ "$existing_pr" != "null" ]; then
  pr_number=$(printf '%s' "$existing_pr" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o=JSON.parse(s);process.stdout.write(String(o.number));})')
  pr_url=$(printf '%s' "$existing_pr" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o=JSON.parse(s);process.stdout.write(o.url);})')
  if ! gh pr edit "$pr_number" --repo "$repo" --title "$title" --body "$body"; then
    step_summary "❌ Host-side PAT PR fallback (secondary) — could not update existing PR #$pr_number."
    die "secondary path: gh pr edit failed"
  fi
  step_summary "✅ Host-side PAT PR fallback (secondary) updated PR [#$pr_number]($pr_url)."
  audit "secondary_updated" "$pr_url" "$(printf '{"branch":"%s"}' "$branch")"
  exit 0
fi

if ! pr_url=$(gh pr create --repo "$repo" --base "${DEFAULT_BRANCH:-main}" --head "$branch" --title "$title" --body "$body" 2>&1); then
  step_summary "❌ Host-side PAT PR fallback (secondary) — \`gh pr create\` errored: $pr_url"
  die "secondary path: gh pr create failed"
fi
step_summary "✅ Host-side PAT PR fallback (secondary) created PR $pr_url for \`$branch\`."
audit "secondary_created" "$pr_url" "$(printf '{"branch":"%s"}' "$branch")"
