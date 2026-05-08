/**
 * @module Infrastructure/PoliticalIntelligence/Render/Style
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Inline page-specific CSS for the political-intelligence dashboard
 *
 * @description
 * Pure string export — the CSS for the political-intelligence page
 * (hero, TOC, cards, day grids, artifact `<details>` toggle, RTL
 * adjustments, mobile breakpoints). Chrome owns header/footer styling.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/** Inline CSS for the political-intelligence dashboard. */
export const PI_EXTRA_STYLE: string = `
        .pi-container { max-width: 1280px; margin: 0 auto; padding: 2rem 1rem 4rem; }
        .pi-page-hero {
            text-align: center;
            padding: 3.25rem 1rem 3rem;
            margin-bottom: 2.5rem;
            background:
                radial-gradient(circle at 25% 15%, rgba(0, 217, 255, 0.10), transparent 32rem),
                radial-gradient(circle at 75% 85%, rgba(255, 0, 110, 0.08), transparent 30rem),
                linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(255, 0, 110, 0.06));
            border: 1px solid rgba(0, 217, 255, 0.25);
            border-radius: 16px;
            position: relative;
            overflow: hidden;
        }
        .pi-page-hero::before {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, transparent 0, transparent 70%, rgba(10, 14, 39, 0.45) 100%);
            pointer-events: none;
        }
        .pi-page-hero > * { position: relative; }
        .pi-page-hero h1 {
            font-family: var(--font-heading, 'Orbitron', sans-serif);
            color: var(--primary-cyan, #00d9ff);
            font-size: clamp(2rem, 4.5vw, 3.25rem);
            margin: 0 0 0.5rem;
            letter-spacing: 0.02em;
            text-shadow: 0 2px 18px rgba(0, 217, 255, 0.25);
        }
        .pi-page-hero p.pi-subtitle {
            color: var(--primary-yellow, #ffbe0b);
            font-size: clamp(1rem, 2vw, 1.25rem);
            margin: 0.25rem 0 1rem;
            font-weight: 500;
        }
        .pi-page-hero p.pi-intro {
            color: var(--light-text, #e0e0e0);
            max-width: 900px;
            margin: 1rem auto 0;
            line-height: 1.7;
        }
        .pi-stats { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.75rem; }
        .pi-stat {
            background: rgba(0, 217, 255, 0.08);
            border: 1px solid rgba(0, 217, 255, 0.3);
            padding: 0.75rem 1.25rem;
            border-radius: 999px;
            color: var(--light-text, #e0e0e0);
            font-size: 0.95rem;
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .pi-stat:hover { transform: translateY(-1px); border-color: rgba(0, 217, 255, 0.55); box-shadow: 0 4px 14px rgba(0, 217, 255, 0.18); }
        .pi-stat strong { color: var(--primary-cyan, #00d9ff); font-size: 1.15rem; margin-right: 0.35rem; font-variant-numeric: tabular-nums; }
        .toc-nav {
            background: var(--mid-bg, #1a1e3d);
            border-radius: 8px;
            padding: 1.25rem 1.5rem;
            margin-bottom: 2rem;
            border-left: 4px solid var(--primary-cyan, #00d9ff);
        }
        .toc-nav h2 {
            font-family: var(--font-heading, 'Orbitron', sans-serif);
            color: var(--primary-cyan, #00d9ff);
            font-size: 1.1rem;
            margin: 0 0 0.75rem;
        }
        .toc-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem; }
        .toc-list a { color: var(--primary-cyan, #00d9ff); text-decoration: none; padding: 0.35rem 0; display: inline-block; }
        .toc-list a:hover, .toc-list a:focus { text-decoration: underline; }

        .pi-section { margin-bottom: 3.5rem; }
        .pi-section-header {
            display: flex; align-items: baseline; justify-content: space-between;
            flex-wrap: wrap; gap: 1rem;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--primary-magenta, #ff006e);
        }
        .pi-section-header h2 {
            font-family: var(--font-heading, 'Orbitron', sans-serif);
            color: var(--primary-magenta, #ff006e);
            font-size: clamp(1.5rem, 3vw, 2rem);
            margin: 0;
        }
        .pi-section-header .pi-section-link a {
            color: var(--primary-cyan, #00d9ff);
            font-size: 0.95rem;
            text-decoration: none;
        }
        .pi-section-header .pi-section-link a:hover { text-decoration: underline; }
        .pi-section-desc { color: var(--muted-text, #a0a3bd); max-width: 900px; line-height: 1.6; margin: 0.5rem 0 1.5rem; }

        .pi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .pi-card {
            background: var(--card-bg, rgba(26, 30, 61, 0.5));
            border: 1px solid rgba(0, 217, 255, 0.18);
            border-radius: 12px;
            padding: 1.35rem 1.25rem 1.25rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
            position: relative;
            overflow: hidden;
        }
        .pi-card::before {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary-cyan, #00d9ff), var(--primary-magenta, #ff006e));
            opacity: 0.55;
            transition: opacity 0.2s ease;
        }
        .pi-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0, 217, 255, 0.18); border-color: rgba(0, 217, 255, 0.5); }
        .pi-card:hover::before { opacity: 1; }
        .pi-card-icon { font-size: 2rem; line-height: 1; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 6px rgba(0, 217, 255, 0.25)); }
        .pi-card-title { margin: 0 0 0.5rem; font-family: var(--font-heading, 'Orbitron', sans-serif); font-size: 1.05rem; }
        .pi-card-title a { color: var(--primary-cyan, #00d9ff); text-decoration: none; }
        .pi-card-title a:hover, .pi-card-title a:focus { text-decoration: underline; }
        .pi-card-desc { color: var(--light-text, #e0e0e0); line-height: 1.55; margin: 0 0 0.75rem; font-size: 0.95rem; }
        .pi-card-meta { margin: 0 0 0.5rem; }
        .pi-card-file { font-family: var(--font-mono, 'Courier New', monospace); font-size: 0.8rem; color: var(--primary-yellow, #ffbe0b); background: rgba(255, 190, 11, 0.08); border: 1px solid rgba(255, 190, 11, 0.25); border-radius: 4px; padding: 0.1rem 0.4rem; }
        .pi-card-link a { color: var(--primary-cyan, #00d9ff); font-size: 0.9rem; text-decoration: none; }
        .pi-card-link a:hover { text-decoration: underline; }

        .pi-day { background: var(--card-bg, rgba(26, 30, 61, 0.5)); border: 1px solid rgba(0, 217, 255, 0.18); border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .pi-day:hover { border-color: rgba(0, 217, 255, 0.4); box-shadow: 0 6px 22px rgba(0, 217, 255, 0.12); }
        .pi-day-header { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .pi-day-header h3 { margin: 0; font-family: var(--font-heading, 'Orbitron', sans-serif); color: var(--primary-cyan, #00d9ff); font-size: 1.2rem; font-variant-numeric: tabular-nums; }
        .pi-day-total { background: rgba(255, 0, 110, 0.12); border: 1px solid rgba(255, 0, 110, 0.35); color: var(--primary-magenta, #ff006e); padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.85rem; font-variant-numeric: tabular-nums; }
        .pi-day-github { margin-left: auto; color: var(--primary-cyan, #00d9ff); text-decoration: none; font-size: 0.9rem; }
        .pi-day-github:hover { text-decoration: underline; }

        .pi-streams { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; }
        .pi-stream-link {
            display: flex; align-items: center; gap: 0.5rem; color: var(--primary-cyan, #00d9ff); text-decoration: none;
            background: rgba(0, 217, 255, 0.05); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(0, 217, 255, 0.15);
            transition: background 0.2s ease, border-color 0.2s ease;
        }
        .pi-stream-link:hover, .pi-stream-link:focus { background: rgba(0, 217, 255, 0.12); border-color: rgba(0, 217, 255, 0.4); }
        .pi-stream-icon { font-size: 1.1rem; }
        .pi-stream-name { flex: 1; font-weight: 600; }
        .pi-stream-count { background: rgba(0, 217, 255, 0.18); color: var(--primary-cyan, #00d9ff); padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.8rem; font-variant-numeric: tabular-nums; }
        .pi-stream-desc { margin: 0.25rem 0 0; font-size: 0.8rem; color: var(--muted-text, #a0a3bd); line-height: 1.5; }

        .pi-stream-artifacts { margin: 0.4rem 0 0; }
        .pi-stream-artifacts-summary {
            list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;
            font-size: 0.8rem; color: var(--primary-cyan, #00d9ff); padding: 0.2rem 0.5rem; border-radius: 4px;
            background: rgba(0, 217, 255, 0.06); border: 1px solid rgba(0, 217, 255, 0.18);
        }
        .pi-stream-artifacts-summary::-webkit-details-marker { display: none; }
        .pi-stream-artifacts-summary:hover, .pi-stream-artifacts-summary:focus { background: rgba(0, 217, 255, 0.14); }
        .pi-stream-artifacts[open] .pi-stream-artifacts-toggle { transform: rotate(90deg); }
        .pi-stream-artifacts-toggle { display: inline-block; transition: transform 120ms ease; }
        .pi-stream-artifacts-count { color: var(--muted-text, #a0a3bd); font-variant-numeric: tabular-nums; }
        .pi-artifact-list { list-style: decimal inside; margin: 0.5rem 0 0; padding: 0.5rem 0.5rem 0.5rem 1rem; background: rgba(10, 14, 39, 0.4); border-radius: 6px; border: 1px solid rgba(0, 217, 255, 0.12); }
        .pi-artifact { margin: 0.25rem 0; line-height: 1.5; }
        .pi-artifact a { display: inline-flex; align-items: baseline; gap: 0.4rem; color: var(--primary-cyan, #00d9ff); text-decoration: none; font-size: 0.85rem; }
        .pi-artifact a:hover, .pi-artifact a:focus { text-decoration: underline; }
        .pi-artifact-icon { font-size: 0.95rem; }
        .pi-artifact-title { font-weight: 500; }
        .pi-artifact-file { font-family: 'Courier New', monospace; font-size: 0.72rem; color: var(--muted-text, #a0a3bd); background: rgba(0, 217, 255, 0.05); padding: 0.05rem 0.3rem; border-radius: 3px; }

        .pi-older-toggle { display: block; width: 100%; text-align: left; background: transparent; border: 1px dashed rgba(0, 217, 255, 0.3); color: var(--primary-cyan, #00d9ff); padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 0.5rem; }
        .pi-older-toggle:hover, .pi-older-toggle:focus { background: rgba(0, 217, 255, 0.06); }
        .pi-older-content[hidden] { display: none; }

        @media (max-width: 640px) {
            .pi-container { padding: 1rem 0.5rem 3rem; }
            .pi-page-hero { padding: 2rem 0.75rem; }
            .pi-grid { grid-template-columns: 1fr; }
            .pi-streams { grid-template-columns: 1fr; }
        }

        [dir="rtl"] .pi-day-github { margin-left: 0; margin-right: auto; }
        [dir="rtl"] .toc-nav { border-left: none; border-right: 4px solid var(--primary-cyan, #00d9ff); }
`;
