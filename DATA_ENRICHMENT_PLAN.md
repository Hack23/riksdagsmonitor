# Data Enrichment Plan for Opposition Motion Articles

## Current State
Opposition motion articles display "undefined" for author and party fields because:
1. The motion API data (`get_motioner`) lacks `intressent_namn`, `author`, and `parti` fields
2. The generation script attempts to render these fields without checking for undefined

## Solution: Enrich with Real Data

### Data Source
Use `riksdag-regering get_dokument` with `include_full_text: true` to fetch detailed document information.

### Document Structure
The full document includes a `<dokumentstatus>` XML structure with author information:

```xml
<dokumentstatus>
  <dokument>
    <dok_id>HD023904</dok_id>
    ...
  </dokument>
  <dokintressent>
    <intressent>
      <intressent_id>065105536026</intressent_id>
      <namn>Niklas Karlsson</namn>
      <partibet>S</partibet>
      <roll>undertecknare</roll>
      <ordning>1</ordning>
    </intressent>
    ...
  </dokintressent>
</dokumentstatus>
```

### Extraction Logic
1. Parse XML from the `text` field
2. Find all `<intressent>` elements
3. Filter for `<roll>undertecknare</roll>` (signatories)
4. Get the first signatory (primary author):
   - Extract `<namn>` for author name
   - Extract `<partibet>` for party code
5. Format as "Name m.fl." (et al.) if multiple signatories

### Implementation Steps

#### 1. Fetch Document Details
```javascript
import { riksdagRegeringGetDokument } from '@modelcontextprotocol/server-riksdag-regering';

const doc = await riksdagRegeringGetDokument({
  dok_id: 'HD023904',
  include_full_text: true
});
```

#### 2. Parse XML and Extract Author Info
```javascript
import { parseStringPromise } from 'xml2js';

const xmlData = await parseStringPromise(doc.text);
const intressenter = xmlData.dokumentstatus.dokintressent[0].intressent;

// Get primary author (first undertecknare)
const primaryAuthor = intressenter.find(i => i.roll[0] === 'undertecknare');
const authorName = primaryAuthor?.namn[0] || null;
const partyCode = primaryAuthor?.partibet[0] || null;

// Format with m.fl. if multiple authors
const formattedAuthor = intressenter.length > 1 
  ? `${authorName} m.fl.` 
  : authorName;
```

#### 3. Update Articles
For each language, update the HTML:
```javascript
// Replace undefined with real data
content = content.replace(
  /(<p><strong>Author:<\/strong>\s*)undefined(<\/p>)/,
  `$1${formattedAuthor}$2`
);

content = content.replace(
  /(<p><strong>Party:<\/strong>\s*)undefined(<\/p>)/,
  `$1${partyCode}$2`
);
```

### Documents to Enrich
From the 2026-02-16 opposition motions article:
- HD023904, HD023903, HD023902, HD023901, HD023900
- HD023899, HD023898, HD023897, HD023896, HD023895

### Example Data
**HD023904**: Niklas Karlsson m.fl. (S)
- Primary author: Niklas Karlsson
- Party: S (Social Democrats)
- 7 co-signatories (all from S party)

### Translation Considerations
Translate party codes to full names per language:
- S → Social Democrats / Socialdemokraterna
- M → Moderates / Moderaterna
- SD → Sweden Democrats / Sverigedemokraterna
- C → Centre Party / Centerpartiet
- V → Left Party / Vänsterpartiet
- KD → Christian Democrats / Kristdemokraterna
- L → Liberals / Liberalerna
- MP → Green Party / Miljöpartiet

### Testing
Before committing enriched data:
1. Verify all documents fetched successfully
2. Confirm author names extracted correctly
3. Check party codes are valid
4. Test all 14 language versions
5. Validate HTML structure preserved
6. Run htmlhint validation

### Benefits
- ✅ Complete, accurate news coverage
- ✅ Proper attribution of motions
- ✅ Professional presentation
- ✅ No "undefined" placeholders
- ✅ Maintains data integrity

### Future Automation
Add enrichment step to news generation workflow:
1. Generate articles with motion data
2. Enrich undefined fields with document details
3. Translate and localize all content
4. Validate and publish

This ensures all future articles have complete data from the start.
