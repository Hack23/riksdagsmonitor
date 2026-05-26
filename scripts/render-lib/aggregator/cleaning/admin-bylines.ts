/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/AdminBylines
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Paragraph-level admin-byline stripper
 *
 * @description
 * Removes paragraphs whose fragments are **entirely** composed of bold-
 * label admin metadata (`**Author**: …`, `**Run ID**: …`, `**Confidence**:
 * …`). Mixed paragraphs (with at least one fact-bearing fragment) are
 * preserved verbatim — see {@link stripLeadingAdminBylines}.
 *
 * Pure string transform, zero filesystem / markdown dependencies.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Admin-byline field names recognised in analysis artifacts. A paragraph
 * whose fragments are **entirely** composed of these labelled fields is
 * template preamble, not prose — strip it. Fields are grouped by origin
 * for maintainability:
 *
 * - **Legacy** — fields emitted by the original analysis templates.
 * - **Extended 2026-04-24** — fields from executive-brief / realtime
 *   templates that previously leaked into `<meta description>`; added
 *   per `seo-metadata-contract.md` §5.
 * - **Round 2-6 (2026-04-27)** — additional preamble fields observed
 *   leaking 393 times across 36 of 41 articles in per-document, family
 *   C and family D artifacts. Includes Swedish-language labels and
 *   audit timestamp variants.
 *
 * To add a new field, append it to this list and add a test in
 * `tests/render-lib/cleaning/admin-bylines.test.ts`.
 */
export const ADMIN_FIELD_NAMES: readonly string[] = [
  // Legacy
  'Author',
  'Run\\s*ID',
  'Date',
  'Classification',
  'Confidence',
  'Scope',
  'Admiralty(?:\\s*(?:range|baseline))?',
  'Read[-\\s]?time',
  'Version',
  'Status',
  'Owner',
  'Last\\s*Updated',
  'Generated',
  // Extended 2026-04-24 — see seo-metadata-contract.md §5.
  'Brief\\s*ID',
  'Prepared\\s*by',
  'Prepared\\s*at',
  'Analyst',
  'Distribution',
  'Methodology',
  'Cycle',
  '60[-\\s]?second\\s*read',
  'Reviewed\\s*by',
  'Reviewer',
  'Disseminated',
  'Source',
  'Dissemination',
  // Extended 2026-04-27 — preamble fields observed leaking into Executive
  // Brief / synthesis / per-document headers across 28 of 41 articles. See
  // analysis/daily/2026-04-27/propositions/executive-brief.md for the
  // canonical leak shape (`**Author** \n **Date** \n **Analysis period** \n
  // **Confidence** \n **Classification** \n **Pass 2**`). Without these
  // entries the entire admin paragraph fails the `allAdmin` test in
  // `stripLeadingAdminBylines` because two fragments are unrecognised, so
  // the whole template preamble survives into the published article body.
  // Round 2: scenario-analysis / comparative-international /
  // methodology-reflection / coalition-mathematics / etc. preambles add
  // Horizon / Method / Focus / Workflow / Purpose / Analysis date as
  // structured `**Label**: value` admin fragments before any prose.
  'Analysis\\s*period',
  'Analysis\\s*date',
  'Horizon',
  'Method',
  'Focus',
  'Workflow',
  'Purpose',
  'Pass\\s*2',
  'AI[-\\s]?FIRST\\s*iterations?',
  'ARTICLE_TYPE',
  'Article\\s*type',
  'Article\\s*period',
  'Period',
  'Window',
  'Coverage\\s*window',
  'Run\\s*started',
  'Run\\s*completed',
  'Run\\s*at',
  // Round 3 (2026-04-27) — per-document and per-artifact preamble fields
  // observed leaking 393 times across 36 of 41 articles. These appear as
  // structured `**Label**: value` fragments in the leading paragraph of
  // exec briefs, per-document analyses (`documents/{dok_id}-analysis.md`)
  // and Family C artifacts. Examples:
  //   - **F3EAD Stage**: Exploit
  //   - **Framework**: Political SWOT v3.4
  //   - **Dok ID** / **Dok-ID** / **Dok_ID** / **Document ID**: HD03253
  //   - **SCN-ID**, **SIG-ID**, **STA-ID**, **RSK-ID**, **THR-ID**,
  //     **CMP-ID**, **CLS-ID**, **XRF-ID**, **MTH-ID** (artifact-row IDs)
  //   - **Organ**: FiU | **Subject**: ... | **Type**: Proposition
  //   - **Comparator set**: Sweden vs DE/FR | **Election date**: 2026-09
  // Body-text mentions like *"the Party (S) filed..."* are not bold +
  // colon-anchored, so they pass `ADMIN_FIELD_RE` correctly.
  'F3EAD\\s*Stage',
  'Framework',
  'Party',
  'Dok[-_\\s]?ID',
  'Document(?:\\s*ID)?',
  'Organ',
  'Subject',
  'Type',
  'Committee',
  'Comparator(?:\\s*set)?',
  'Election\\s*date',
  '[A-Z]{3}[-_]ID',
  // Round 4 (2026-04-27) — additional preamble fields observed in
  // per-document, family C and family D artifacts. Riksmöte = Swedish
  // parliamentary year (e.g. `2025/26`); DIW Score = significance ranking
  // header (Diplomatic / Informational / Wider impact); Confidence
  // distribution / Confidence floor = artifact-level trust roll-ups.
  'Riksm(?:ö|o)te',
  'DIW\\s*Score',
  'Confidence\\s*(?:distribution|floor|baseline)',
  'Frame',
  'Question',
  'Overall\\s*Threat\\s*Level',
  'Overall\\s*Risk\\s*Level',
  'Overall\\s*Score',
  'Tradecraft(?:\\s*context)?',
  'PIRs?(?:\\s*served)?',
  'Source\\s*Diversity(?:\\s*floor)?',
  'WEP\\+ODNI',
  'SATs?\\s*applied',
  'ICD\\s*203(?:\\s*standards)?',
  'Hash',
  'Signature',
  'Provenance',
  // Round 5 (2026-04-27) — manifest / synthesis preamble fields. The
  // `data-download-manifest.md` and `synthesis-summary.md` artifacts emit
  // structured run-metadata that is never article content.
  'Article\\s*Type',
  'Article\\s*Date',
  'Analysis\\s*Type',
  'Analysis\\s*Depth',
  'Data\\s*Sources?',
  'Documents?\\s*Downloaded',
  'Documents?\\s*Selected(?:\\s*\\([^)]+\\))?',
  'Produced\\s*By',
  'Scope\\s*of\\s*this\\s*file',
  // Round 6 (2026-04-27) — per-document and per-artifact preamble fields
  // used in motion / interpellation / proposition / committee templates.
  // Includes Swedish-language labels and audit timestamp variants.
  'Session',
  'Datum',
  'Tier',
  'DIW\\s*Tier',
  'Admiralty\\s*Source\\s*Code',
  'Inl(?:ä|a)mnare',
  'Mottagare',
  'Talman',
  'Ministry',
  'SISVA(?:\\s*\\([^)]+\\))?',
  'Filed(?:\\s*by)?',
  'Effective\\s*[Dd]ate',
  'Tabling\\s*date',
  'Requested\\s*date',
  'Source\\s*authority',
  'UTC\\s*Timestamp',
  'Analysis\\s*Timestamp',
  'Analysis\\s*run',
  'Updated',
  'Level',
  'Relates\\s*to',
  'frs',
  // Round 7 (2026-05-09) — preamble fields observed leaking into
  // <meta description> for propositions / realtime-pulse / interpellation
  // articles. Audit of news/2026-05-08-*-en.html showed:
  //   - propositions: "DIW Composite: 10.0/10 (election-adjusted)"
  //   - realtime-pulse: "Audience: Editors, researchers, engaged citizens"
  // The paragraph-level stripper requires every fragment in the leading
  // paragraph to match ADMIN_FIELD_RE; without these labels the whole
  // admin block survives into the <meta description>. Per
  // seo-metadata-contract.md §3.1 ("No admin metadata"), these MUST
  // never reach the SERP snippet.
  'WEP',
  'WEP\\s*\\+\\s*ODNI',
  'WEP\\s*Confidence',
  'WEP\\s*summary',
  'DIW(?:\\s*(?:Composite|Total|Index|Rating|Aggregate|Score))?',
  'Audience(?:\\s*for\\s*this\\s*brief)?',
  'Disseminated\\s*at',
  'Generated\\s*at',
  'Iteration',
  'Editor',
  'Editorial\\s*owner',
  // Round 8 (2026-05-09) — additional preamble fields observed in
  // executive-briefs across analysis/daily/2026-05-{05,06,07}/. Audit
  // showed the following labels leaking into <title> + <meta description>
  // because they were not in ADMIN_FIELD_NAMES:
  //   - 2026-05-07/evening-analysis: `**DIW Aggregate**`, `**Horizon**`,
  //     `**Reading time**`
  //   - 2026-05-07/propositions: `**WEP Confidence**`
  //   - 2026-05-07/year-ahead: `**Workflow**`, `**Election**`,
  //     `**IMF vintage**`, `**Riksmöte**`
  //   - 2026-05-05/evening-analysis: `**For**`, `**Election countdown**`
  //   - 2026-05-05/interpellations: `**Prepared**`, `**Analyst confidence**`,
  //     `**WEP summary**`
  // All structured `**Label**: value` fields with one extra job: keep
  // the regex narrow enough that real prose words (`For example, …`,
  // `Election results show …`) do NOT match (they have no colon, so the
  // `\s*:` tail filters them out).
  'Horizon',
  'Reading\\s*time',
  'Workflow',
  'Election(?:\\s*countdown|\\s*date|\\s*proximity)?',
  'IMF\\s*vintage',
  'Riksm(?:ö|o)te',
  'For',
  'Prepared',
  'Analyst\\s*confidence',
  'Pass(?:\\s*\\d+)?',
  'AI[-\\s]?FIRST(?:\\s+iterations?)?',
  'ARTICLE_TYPE',
  // Round 9 (2026-05-25) — multi-language admin-byline labels. The
  // executive-brief is translated into 14 languages, and the per-
  // language `executive-brief_<lang>.md` ships the admin block with
  // the *translated* labels (`Klassificering: OFFENTLIG`, `Författare:
  // Riksdagsmonitor`, `Datum: 2026-05-22`, …) in the SV/DA/NO/DE/FR/
  // ES/NL/FI variants. Audit 2026-05-25 of news/index_sv.html
  // confirmed pipe-separated SV admin lines like
  //   `**Klassificering**: OFFENTLIG | **Datum**: 2026-05-22 | **Författare**: Riksdagsmonitor`
  // leaked into the SERP `<meta description>` because the SV labels
  // were not in this dictionary — only `Datum` was. The full
  // translation table below covers the labels appearing in
  // `analysis/templates/executive-brief_*.md` and observed in live
  // translated briefs.
  //
  // Keep the regex narrow (still anchored to `^**LABEL**:`) so real
  // prose words sharing a label spelling (e.g. SV `Datum` as a
  // sentence-leading noun) are never matched without the trailing
  // colon.
  //
  // ── Swedish (sv) ───────────────────────────────────────────────────
  'F(?:ö|o)rfattare',         // Author
  'K(?:ä|a)lla',              // Source
  'Klassificering',           // Classification
  'Tillf(?:ö|o)rlitlighet',   // Confidence
  'Konfidens',                // Confidence (alt.)
  'L(?:ä|a)stid',             // Read time
  'Publicerad',               // Published
  'Distribution',             // Distribution
  'Granskad\\s*av',           // Reviewed by
  'F(?:ö|o)rberedd\\s*av',    // Prepared by
  'Genererad',                // Generated
  'Genererad\\s*kl',          // Generated at
  'Genererad\\s*den',         // Generated on
  'K(?:ö|o)rnings[-\\s]?ID',  // Run ID (sv) — used by news-translate
  // ── Danish (da) ────────────────────────────────────────────────────
  'Forfatter',                // Author
  'Kilde',                    // Source
  'Klassifikation',           // Classification
  'Tillid',                   // Confidence
  'Dato',                     // Date
  'L(?:æ|ae)setid',           // Read time
  'Udarbejdet\\s*af',         // Prepared by
  'Gennemgået\\s*af',         // Reviewed by
  'K(?:ø|o)rselsnummer',      // Run ID (da)
  // ── Norwegian (no) ─────────────────────────────────────────────────
  'Forfatter',                // Author (shared with DA)
  'Kilde',                    // Source (shared with DA)
  'Klassifisering',           // Classification
  'Tillit',                   // Confidence
  'Lesetid',                  // Read time
  'Utarbeidet\\s*av',         // Prepared by
  'Gjennomgått\\s*av',        // Reviewed by
  'Kj(?:ø|o)re[-\\s]?ID',     // Run ID (no)
  // ── Finnish (fi) ───────────────────────────────────────────────────
  'Tekij(?:ä|a)',             // Author
  'L(?:ä|a)hde',              // Source
  'Luokitus',                 // Classification
  'Luottamus',                // Confidence
  'P(?:ä|a)iv(?:ä|a)ys',      // Date
  'P(?:ä|a)iv(?:ä|a)m(?:ä|a)(?:ä|a)r(?:ä|a)',  // Date (Päivämäärä)
  'Lukuaika',                 // Read time
  'Valmistellut',             // Prepared by
  'Tarkastanut',              // Reviewed by
  'Ajo[-\\s]?ID',             // Run ID (fi)
  // ── German (de) ────────────────────────────────────────────────────
  'Verfasser',                // Author
  'Autor',                    // Author
  'Quelle',                   // Source
  'Klassifizierung',          // Classification
  'Klassifikation',           // Classification (alt.)
  'Vertraulichkeit',          // Confidence/Classification
  'Vertrauen',                // Confidence
  'Konfidenz',                // Confidence (de)
  'Datum',                    // Date (shared with SV)
  'Lesezeit',                 // Read time
  'Erstellt\\s*von',          // Prepared by
  'Erstellt\\s*am',           // Generated at
  'Gepr(?:ü|u)ft\\s*von',     // Reviewed by
  'Ver(?:ö|o)ffentlicht',     // Published
  'Lauf[-\\s]?ID',            // Run ID (de)
  // ── French (fr) ────────────────────────────────────────────────────
  'Auteur',                   // Author
  'Source',                   // Source (shared with EN)
  'Classification',           // already above
  'Confiance',                // Confidence
  'Date',                     // already above
  'Temps\\s*de\\s*lecture',   // Read time
  'Pr(?:é|e)par(?:é|e)\\s*par',   // Prepared by
  'R(?:é|e)vis(?:é|e)\\s*par',    // Reviewed by
  'Publi(?:é|e)',             // Published
  "ID\\s*d['’]ex(?:é|e)cution", // Run ID (fr) — `ID d'exécution`
  // ── Spanish (es) ───────────────────────────────────────────────────
  'Autor',                    // Author (shared with DE)
  'Fuente',                   // Source
  'Clasificaci(?:ó|o)n',      // Classification
  'Confianza',                // Confidence
  'Fecha',                    // Date
  'Tiempo\\s*de\\s*lectura',  // Read time
  'Preparado\\s*por',         // Prepared by
  'Revisado\\s*por',          // Reviewed by
  'Publicado',                // Published
  'ID\\s*de\\s*ejecuci(?:ó|o)n', // Run ID (es)
  // ── Dutch (nl) ─────────────────────────────────────────────────────
  'Auteur',                   // Author
  'Bron',                     // Source
  'Classificatie',            // Classification
  'Vertrouwen',               // Confidence
  'Betrouwbaarheid',          // Confidence (nl)
  'Datum',                    // Date (shared)
  'Leestijd',                 // Read time
  'Opgesteld\\s*door',        // Prepared by
  'Beoordeeld\\s*door',       // Reviewed by
  'Gepubliceerd',             // Published
  'Run[-\\s]?ID',             // Run ID (nl/en)
  // ── Arabic (ar) ────────────────────────────────────────────────────
  'المؤلف',                   // Author
  'المصدر',                   // Source
  'التصنيف',                  // Classification
  'الثقة',                    // Confidence
  'التاريخ',                  // Date
  'وقت\\s*القراءة',           // Read time
  'أعد\\s*بواسطة',            // Prepared by
  'راجعه',                    // Reviewed by
  'معرف\\s*التشغيل',          // Run ID (ar)
  // ── Hebrew (he) ────────────────────────────────────────────────────
  'מחבר',                     // Author
  'מקור',                     // Source
  'סיווג',                    // Classification
  'אמון',                     // Confidence
  'תאריך',                    // Date
  'זמן\\s*קריאה',             // Read time
  'הוכן\\s*על\\s*ידי',        // Prepared by
  'נסקר\\s*על\\s*ידי',        // Reviewed by
  'מזהה\\s*הרצה',             // Run ID (he)
  // ── Japanese (ja) ──────────────────────────────────────────────────
  '著者',                      // Author
  '出典',                      // Source
  '分類',                      // Classification
  '機密区分',                  // Confidence/Classification
  '信頼度',                    // Confidence
  '日付',                      // Date
  '読了時間',                  // Read time
  '作成者',                    // Prepared by
  '査読者',                    // Reviewed by
  '公開日',                    // Published
  '実行ID',                    // Run ID (ja)
  // ── Korean (ko) ────────────────────────────────────────────────────
  '저자',                      // Author
  '출처',                      // Source
  '분류',                      // Classification
  '신뢰도',                    // Confidence
  '날짜',                      // Date
  '읽기\\s*시간',              // Read time
  '작성자',                    // Prepared by
  '검토자',                    // Reviewed by
  '게시일',                    // Published
  '실행\\s*ID',                // Run ID (ko)
  // ── Chinese (zh) ───────────────────────────────────────────────────
  '作者',                      // Author
  '来源',                      // Source
  '分类',                      // Classification
  '机密等级',                  // Classification
  '可信度',                    // Confidence
  '日期',                      // Date
  '阅读时间',                  // Read time
  '编制者',                    // Prepared by
  '审核者',                    // Reviewed by
  '发布',                      // Published
  '运行ID',                    // Run ID (zh)
];

/**
 * Bold-label admin-byline pattern. Matches a fragment that begins with
 * one of the field names in {@link ADMIN_FIELD_NAMES}, followed by a
 * colon. `**` wrapping is optional so unbolded admin lines (e.g. read
 * back from rendered HTML where emphasis has been stripped) are also
 * caught. Case-insensitive.
 */
export const ADMIN_FIELD_RE = new RegExp(
  `^\\*{0,2}(?:${ADMIN_FIELD_NAMES.join('|')})\\*{0,2}\\s*[：:]`,
  'i',
);

/**
 * Fragment splitter for admin-byline paragraphs. Splits only on
 * **structural** delimiters that genuinely separate distinct fields —
 * newlines, pipes (`|` / fullwidth `｜`), Japanese enumeration comma (`、`),
 * and long runs of whitespace. Deliberately does **not** split on `—` /
 * `·` / `–`, because those commonly appear *inside* admin-field values
 * (e.g. `**Classification**: Public — GDPR Art. 9(2)(e)`) and previously
 * let whole admin paragraphs escape the stripper.
 */
export const ADMIN_FRAGMENT_SPLITTER = /\s*(?:\||｜|、|\n|\s{2,})\s*/;

/**
 * Remove admin-byline paragraphs anywhere in the artifact body. Walks
 * paragraph-by-paragraph; any paragraph whose **lines** are 100% admin
 * is dropped.
 *
 * Multi-value tolerance (Round 8, 2026-05-09): a single line is treated
 * as admin when its **first** fragment matches {@link ADMIN_FIELD_RE}
 * **and** every subsequent fragment on the same line either also
 * matches or is a value continuation (no colon, no `**…**:` re-
 * introduction). This accepts pipe-separated multi-value rows like:
 *
 *   `**WEP Confidence**: Almost certain (ratification) | Likely (geopolitical)`
 *
 * which the 2026-05-09 audit found leaking into the propositions
 * `<meta description>` because the second pipe-fragment had no field
 * label and the previous "every fragment is admin" rule rejected the
 * whole paragraph.
 *
 * Historical context: originally this stripper only ran on **leading**
 * paragraphs and stopped at the first prose paragraph (hence the name).
 * Per-document analyses and Family C/D artifacts emit *additional*
 * admin blocks under internal headings, so the leading-only sweep let
 * ~393 admin-byline lines leak across 36 of 41 articles (audit 2026-
 * 04-27). The current implementation walks the whole body — but still
 * requires a paragraph to be **fully** admin (with the multi-value
 * continuation rule above) — so body prose stays intact while
 * duplicate metadata blocks are removed.
 *
 * The function name and signature are preserved so callers and tests
 * that imported it through `__test__` continue to work; the behaviour
 * is a strict superset of every previous version.
 */
export function stripLeadingAdminBylines(body: string): string {
  const paragraphs = body.split(/\n\n+/);
  const kept: string[] = [];
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) {
      kept.push(p);
      continue;
    }
    const lines = trimmed.split(/\n+/);
    const allLinesAdmin = lines.every((line) => {
      const lineTrimmed = line.trim();
      if (!lineTrimmed) return true;
      const fragments = lineTrimmed.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
      if (fragments.length === 0) return true;
      const firstAdmin = ADMIN_FIELD_RE.test(fragments[0]!.trim());
      if (!firstAdmin) return false;
      return fragments.slice(1).every((f) => {
        const ft = f.trim();
        if (!ft) return true;
        if (ADMIN_FIELD_RE.test(ft)) return true;
        if (ft.startsWith('**')) return false;
        if (ft.includes(':') || ft.includes('：')) return false;
        return true;
      });
    });
    if (allLinesAdmin) continue;
    kept.push(p);
  }
  return kept.join('\n\n');
}
