# Methodology Reflection — Realtime Pulse 2026-05-15

**Author**: James Pether Sörling | **Date**: 2026-05-15  
**Standard**: ICD 203-equivalent audit | **Confidence**: HIGH [B2]

---

## ICD 203-Anpassad Metodrevision

### Revisionspunkter

**1. Källöppet och transparens**
- Primärkällor: riksdag-regering MCP (HD11812, HD10492, HD10493) — direkt parlamentsdatabas [A2]
- Sekundärkällor: Sibling-subfoldersynteserna (propositioner, betänkanden, motioner, interpellationer, week-ahead) [A2]
- IMF-kontext: WEO Apr-2026 vintage (pre-warm) — runtime-anrop misslyckades, fallback använd [B1] ⚠️ Se förbättringsförslag #1
- Voteringsdata: Prior voteringar (KD UU10 197-152; FöU27 248-101) — verifierade i MCP [A2]

**2. Analytisk oberoende**
- Inga externaleringar av analytisk auktoritet — bedömningar är redaktörens egna baserat på primärdata [B2]
- ACH-metodik tillämpat på tre konkurrerande hypoteser
- Konfidenslabels (A1/A2/B1/B2/B3/C3) systematiskt applicerade

**3. Bias-granskning**
- Möjlig bias: Analysen kan systematiskt undervärdera Dousa-svarets kvalitet (H1 undikonsistent utan full insikt i interna dokument) — erkänt som analytisk begränsning [B2]
- Möjlig bias: Sibling-cross-referenserna kan förstärka ett "oppositionsnarrativ" om biståndsnedskärningarna utan tillräcklig balans av regeringens perspektiv — se förbättringsförslag #2

**4. Tidsstämplar och vintage**
- IMF WEO Apr-2026 vintage: BNP +2,3%, skuld ~33%, inflation ~2,0% — gäller till jul 2026 WEO-uppdatering
- Voteringsdata: riksmöte 2024/25 (historisk, ej pågående) — korrekt märkt [A2]
- Realtime-data: 15 maj 2026 (riksdag-regering MCP-anrop) [A2]

---

## ≥3 Förbättringsförslag

### Förbättring #1: IMF SDMX Runtime-validering

**Problem**: `imf-fetch.ts weo` returnerade "fetch failed" under körningen — pre-warm fallback användes för WEO-data. Biståndsnedskärningarnas ODA-procent (0,36%) är ej IMF-verifierat i realtid; uppskattning baserad på V:s interpellationstext.

**Förbättring**: Implementera en fallback-chain: WEO Datamapper → IFS månadsdata → OECD DAC API → cached value. En ODA-procentsats bör vara direkt hämtad från OECD.Stat API (historisk serie LIN_STAT_FLW) snarare än från interpellationstext.

**Prioritet**: HIGH — ODA-siffran är central i biståndanalysen

### Förbättring #2: Balansering av regeringsperspektivet

**Problem**: Analysen bygger primärt på V:s interpellationstexters perspektiv. Regeringens "ny biståndsagendan" (Dousa, dec 2023) har inte analyserats i full text — en mer balanserad syntes skulle kräva läsning av Sida:s årsrapport 2025 och Dousas offentliga tal.

**Förbättring**: Nästa pass (Pass 2) bör inkludera Sida-årsrapport 2025 och Dousas publika tal som motbalans. `get_g0v_document_content` bör anropas för regeringens biståndsdokument.

**Prioritet**: MEDIUM — balansen är viktig för trovärdighet

### Förbättring #3: Voteringsdata för 2025/26-riksmötet

**Problem**: Voteringsdata som citateras (KD UU10, FöU27) är från riksmöte 2024/25. Eventuella voteringsdata från pågående riksmöte 2025/26 har inte hämtats — HD-dokumenten kan ha relevanta voteringsrörelser.

**Förbättring**: Kör `search_voteringar(rm="2025/26", bet="UU")` och `search_voteringar(rm="2025/26", bet="FöU")` för att verifiera 2025/26-data.

**Prioritet**: MEDIUM — viktigt för kontext men ej blockerande för analysen

---

## Analytisk Integritetsdeklaration

Denna analys är producerad av AI-agenten James Pether Sörling (Riksdagsmonitor analytiska system) baserat på riksdag-regering MCP-data och sibling-analyses. All innehåll är märkt med konfidenslabels. Primärkällor är parlamentets officiella databaser. IMF-ekonomisk kontext är baserad på publikt tillgänglig WEO-data (Apr-2026). Analysen är för utbildnings- och journalistiska ändamål. Läsare uppmanas att verifiera primärkällor via riksdagen.se.
