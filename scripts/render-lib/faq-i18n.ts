/**
 * @module Infrastructure/RenderLib/FAQ-I18n
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Per-language FAQ catalogues for sitemap / political-intelligence / news-index
 *
 * @description
 * Pure data module. Three FAQ catalogues — `sitemap`, `politicalIntelligence`,
 * and `newsIndex` — each containing 4–5 question/answer pairs translated
 * for all 14 supported languages. Consumed by the three listing-page
 * generators so that every generated `sitemap_<lang>.html`,
 * `political-intelligence_<lang>.html`, and `news/index_<lang>.html`
 * page emits a Schema.org `FAQPage` JSON-LD block (rich-result eligible
 * on Google + Bing) plus a visible `<details>`-based FAQ section.
 *
 * The translations intentionally avoid third-party dependencies — they
 * reuse the editorial vocabulary already present in
 * `scripts/sitemap-html/i18n.ts`, `scripts/generate-news-indexes/constants.ts`
 * and `scripts/political-intelligence/i18n/page-translations.ts`.
 *
 * Round-7 SEO uplift: see `.github/prompts/seo-metadata-contract.md`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { FAQItem } from '../types/editorial.js';

export type FAQCatalogueKey = 'sitemap' | 'politicalIntelligence' | 'newsIndex';

export interface FAQCatalogues {
  readonly sitemap: readonly FAQItem[];
  readonly politicalIntelligence: readonly FAQItem[];
  readonly newsIndex: readonly FAQItem[];
}

/**
 * FAQ catalogues for every supported language. Answers are intentionally
 * concise (1–3 sentences) so that Google's FAQ rich-result requirement
 * is met (each `acceptedAnswer.text` ≤ 250 chars when rendered) while
 * keeping each entry readable as a `<details>` summary.
 */
export const FAQ_I18N: Record<Language, FAQCatalogues> = {
  en: {
    sitemap: [
      { question: 'What is Riksdagsmonitor?', answer: 'Riksdagsmonitor is an open-source Swedish Parliament intelligence platform that monitors votes, motions, propositions, committee reports and government actions in real time across 14 languages.' },
      { question: 'How often is the sitemap updated?', answer: 'This HTML sitemap is regenerated on every deploy (multiple times per day). The machine-readable XML sitemap is published at /sitemap.xml and refreshes on the same cadence.' },
      { question: 'How do I switch languages?', answer: 'Use the language switcher in the header or the flag links at the bottom of every section. Each of the 14 supported languages has its own dedicated sitemap page (e.g. sitemap_sv.html) with `hreflang` annotations.' },
      { question: 'Where do I find the XML sitemap?', answer: 'The machine-readable XML sitemap is at /sitemap.xml and the search-engine crawler instructions live in /robots.txt. Both are linked from the "Additional Resources" section above.' },
      { question: 'Are the article sources auditable?', answer: 'Yes. Every article links to the underlying analysis artifacts on GitHub (analysis/daily/YYYY-MM-DD/stream/) so any reader can audit the OSINT chain end-to-end.' },
    ],
    politicalIntelligence: [
      { question: 'What is political intelligence?', answer: 'Political intelligence is the systematic collection, analysis and reporting of public-source information about parliamentary and governmental activity, applied here to the Swedish Riksdag and Regeringen.' },
      { question: 'How are the analyses generated?', answer: 'Each analysis follows the AI-FIRST principle: a GitHub Copilot agent produces a first-pass analysis and then re-reads the entire output to refine every section. Minimum two complete iterations are required before publishing.' },
      { question: 'What does AI-FIRST mean?', answer: 'AI-FIRST means we never accept first-pass quality. Every analysis is fully re-evaluated and improved at least once, and the workflow uses its full 60-minute budget — not stopping early on shallow output.' },
      { question: 'Are the sources auditable?', answer: 'Yes. Every methodology, template, and daily artifact links back to its source file on GitHub. Anyone can replay the agentic workflow and verify the OSINT/INTOP chain end-to-end.' },
      { question: 'Which methodologies are used?', answer: 'The platform applies STRIDE / SWOT / Devil\'s Advocacy / Red Team analysis plus Riksdagsmonitor-specific frameworks (political-risk scoring, coalition mathematics, vintage-aware IMF economic context).' },
    ],
    newsIndex: [
      { question: 'How are these articles generated?', answer: 'Each article is produced by an agentic workflow that runs the AI-FIRST pipeline against analysis artifacts published under analysis/daily/YYYY-MM-DD/. The full prompt contract lives in .github/prompts/.' },
      { question: 'How current are the articles?', answer: 'Workflows publish on morning, midday, evening and weekly cadences. The freshest article is at the top of the list and the publication timestamp is shown next to every card.' },
      { question: 'Why are some articles only available in English?', answer: 'Analyses are authored in English first and translated by the news-translate workflow over the following hours. If a non-English version is missing, refresh tomorrow — translations follow within 24 hours.' },
      { question: 'How do I subscribe to the feed?', answer: 'Each language has its own RSS/Atom feed (for English: /rss.xml; for Swedish: /rss_sv.xml, etc.). Add the URL to any RSS reader to follow new articles automatically.' },
      { question: 'Are the sources verifiable?', answer: 'Yes. Every article links to its underlying analysis artifacts on GitHub (analysis/daily/YYYY-MM-DD/stream/) and cites Riksdag/Regering/Myndigheter primary sources with stable IDs.' },
    ],
  },

  sv: {
    sitemap: [
      { question: 'Vad är Riksdagsmonitor?', answer: 'Riksdagsmonitor är en öppen källkods-plattform för svensk politisk underrättelse som bevakar voteringar, motioner, propositioner, utskottsbetänkanden och regeringsbeslut i realtid på 14 språk.' },
      { question: 'Hur ofta uppdateras webbplatskartan?', answer: 'Denna HTML-webbplatskarta genereras om vid varje driftsättning (flera gånger per dygn). Den maskinläsbara XML-versionen finns på /sitemap.xml och uppdateras i samma takt.' },
      { question: 'Hur byter jag språk?', answer: 'Använd språkväljaren i sidhuvudet eller flagglänkarna längst ned i varje sektion. Var och en av de 14 språken har en egen dedicated sitemap page (e.g. sitemap_sv.html) med hreflang-attribut.' },
      { question: 'Var hittar jag XML-webbplatskartan?', answer: 'Den maskinläsbara XML-webbplatskartan finns på /sitemap.xml och sökmotorinstruktionerna i /robots.txt. Båda länkas från sektionen "Ytterligare resurser" ovan.' },
      { question: 'Går artiklarnas källor att granska?', answer: 'Ja. Varje artikel länkar till de underliggande analys-artefakterna på GitHub (analysis/daily/YYYY-MM-DD/stream/) så vem som helst kan granska OSINT-kedjan från början till slut.' },
    ],
    politicalIntelligence: [
      { question: 'Vad är politisk underrättelse?', answer: 'Politisk underrättelse är systematisk insamling, analys och rapportering av offentliga källor om parlaments- och regeringsaktivitet — här tillämpat på Sveriges riksdag och regering.' },
      { question: 'Hur produceras analyserna?', answer: 'Varje analys följer AI-FIRST-principen: en GitHub Copilot-agent gör en första analys och läser sedan om hela produkten för att förfina varje avsnitt. Minst två kompletta iterationer krävs före publicering.' },
      { question: 'Vad betyder AI-FIRST?', answer: 'AI-FIRST betyder att vi aldrig accepterar förstahandskvalitet. Varje analys utvärderas och förbättras minst en gång till, och arbetsflödet utnyttjar hela sin 60-minutersbudget innan publicering.' },
      { question: 'Är källorna granskningsbara?', answer: 'Ja. Varje metod, mall och daglig artefakt länkar tillbaka till sin källfil på GitHub. Vem som helst kan köra om det agentiska arbetsflödet och verifiera OSINT/INTOP-kedjan.' },
      { question: 'Vilka metoder används?', answer: 'Plattformen tillämpar STRIDE / SWOT / Devil\'s Advocacy / Red Team-analys plus Riksdagsmonitor-specifika ramverk (politisk riskpoängsättning, koalitionsmatematik, IMF-ekonomisk kontext med vintage-medvetenhet).' },
    ],
    newsIndex: [
      { question: 'Hur skapas dessa artiklar?', answer: 'Varje artikel produceras av ett agentiskt arbetsflöde som kör AI-FIRST-pipen mot analys-artefakter under analysis/daily/YYYY-MM-DD/. Det fullständiga promptkontraktet finns i .github/prompts/.' },
      { question: 'Hur färska är artiklarna?', answer: 'Arbetsflöden publicerar morgon, middag, kväll och varje vecka. Den färskaste artikeln visas överst och publiceringstiden visas på varje kort.' },
      { question: 'Varför finns vissa artiklar bara på engelska?', answer: 'Analyser skrivs först på engelska och översätts av news-translate-arbetsflödet inom 24 timmar. Om en icke-engelsk version saknas, kom tillbaka imorgon — översättningar följer.' },
      { question: 'Hur prenumererar jag på flödet?', answer: 'Varje språk har ett eget RSS/Atom-flöde (svenska: /rss_sv.xml). Lägg till URL:en i valfri RSS-läsare för att följa nya artiklar automatiskt.' },
      { question: 'Är källorna verifierbara?', answer: 'Ja. Varje artikel länkar till sina analys-artefakter på GitHub (analysis/daily/YYYY-MM-DD/stream/) och citerar primärkällor från riksdag, regering och myndigheter med stabila ID:n.' },
    ],
  },

  da: {
    sitemap: [
      { question: 'Hvad er Riksdagsmonitor?', answer: 'Riksdagsmonitor er en open source-platform for politisk efterretning om Sveriges Rigsdag — overvåger afstemninger, motioner, lovforslag, udvalgsbetænkninger og regeringsbeslutninger på 14 sprog.' },
      { question: 'Hvor ofte opdateres sitemappet?', answer: 'Dette HTML-sitemap regenereres ved hver implementering (flere gange dagligt). Det maskinlæsbare XML-sitemap findes på /sitemap.xml og opdateres samme takt.' },
      { question: 'Hvordan skifter jeg sprog?', answer: 'Brug sprogvælgeren i sidehovedet eller flaglinkene nederst i hver sektion. Hvert af de 14 understøttede sprog har sin egen dedicated sitemap page (e.g. sitemap_sv.html) med hreflang-annoteringer.' },
      { question: 'Hvor finder jeg XML-sitemappet?', answer: 'Det maskinlæsbare XML-sitemap er på /sitemap.xml, og crawler-instruktioner ligger i /robots.txt. Begge er linket fra sektionen "Yderligere ressourcer" ovenfor.' },
      { question: 'Kan artiklernes kilder kontrolleres?', answer: 'Ja. Hver artikel linker til de underliggende analyseartefakter på GitHub (analysis/daily/YYYY-MM-DD/stream/) så enhver læser kan revidere OSINT-kæden ende-til-ende.' },
    ],
    politicalIntelligence: [
      { question: 'Hvad er politisk efterretning?', answer: 'Politisk efterretning er systematisk indsamling, analyse og rapportering af offentlige kilder om parlamentarisk og regeringsmæssig aktivitet — her anvendt på Sveriges Rigsdag og Regering.' },
      { question: 'Hvordan genereres analyserne?', answer: 'Hver analyse følger AI-FIRST-princippet: en GitHub Copilot-agent producerer en første analyse og genlæser derefter hele outputtet for at forfine hvert afsnit. Mindst to fulde iterationer kræves før publicering.' },
      { question: 'Hvad betyder AI-FIRST?', answer: 'AI-FIRST betyder at vi aldrig accepterer kvalitet på første gennemløb. Hver analyse genvurderes og forbedres mindst én gang, og workflowet bruger sit fulde 60-minutters budget.' },
      { question: 'Kan kilderne kontrolleres?', answer: 'Ja. Hver metodologi, skabelon og daglig artefakt linker tilbage til sin kildefil på GitHub. Enhver kan genafspille det agentbaserede workflow og verificere OSINT/INTOP-kæden.' },
      { question: 'Hvilke metodologier bruges?', answer: 'Platformen anvender STRIDE / SWOT / Devil\'s Advocacy / Red Team-analyse plus Riksdagsmonitor-specifikke rammer (politisk risikoscoring, koalitionsmatematik, IMF-økonomisk kontekst).' },
    ],
    newsIndex: [
      { question: 'Hvordan genereres disse artikler?', answer: 'Hver artikel produceres af et agentbaseret workflow som kører AI-FIRST-pipen mod analyseartefakter under analysis/daily/YYYY-MM-DD/. Den fulde promptkontrakt ligger i .github/prompts/.' },
      { question: 'Hvor aktuelle er artiklerne?', answer: 'Workflows publicerer morgen, middag, aften og ugentligt. Den nyeste artikel ligger øverst og publiceringstidspunktet vises på hvert kort.' },
      { question: 'Hvorfor er nogle artikler kun på engelsk?', answer: 'Analyser skrives først på engelsk og oversættes af news-translate-workflowet inden for 24 timer. Hvis en ikke-engelsk version mangler, kom tilbage i morgen.' },
      { question: 'Hvordan abonnerer jeg på feedet?', answer: 'Hvert sprog har sit eget RSS/Atom-feed (dansk: /rss_da.xml). Tilføj URL\'en i en RSS-læser for at følge nye artikler automatisk.' },
      { question: 'Er kilderne verificerbare?', answer: 'Ja. Hver artikel linker til sine analyseartefakter på GitHub (analysis/daily/YYYY-MM-DD/stream/) og citerer primære kilder fra Rigsdag, Regering og myndigheder med stabile ID-er.' },
    ],
  },

  no: {
    sitemap: [
      { question: 'Hva er Riksdagsmonitor?', answer: 'Riksdagsmonitor er en åpen kildekode-plattform for politisk etterretning om Sveriges Riksdag — overvåker voteringer, forslag, proposisjoner, komitéinnstillinger og regjeringsvedtak på 14 språk.' },
      { question: 'Hvor ofte oppdateres nettstedskartet?', answer: 'Dette HTML-nettstedskartet regenereres ved hver utrulling (flere ganger per døgn). Den maskinlesbare XML-versjonen finnes på /sitemap.xml og oppdateres i samme takt.' },
      { question: 'Hvordan bytter jeg språk?', answer: 'Bruk språkvelgeren i toppen eller flaggene nederst i hver seksjon. Hvert av de 14 støttede språkene har sin egen dedicated sitemap page (e.g. sitemap_sv.html) med hreflang-attributt.' },
      { question: 'Hvor finner jeg XML-nettstedskartet?', answer: 'Det maskinlesbare XML-nettstedskartet ligger på /sitemap.xml, og crawler-instruksjoner i /robots.txt. Begge er lenket fra "Ytterligere ressurser"-seksjonen ovenfor.' },
      { question: 'Kan artikkelkildene revideres?', answer: 'Ja. Hver artikkel lenker til de underliggende analyseartefaktene på GitHub (analysis/daily/YYYY-MM-DD/stream/) slik at enhver leser kan revidere OSINT-kjeden ende-til-ende.' },
    ],
    politicalIntelligence: [
      { question: 'Hva er politisk etterretning?', answer: 'Politisk etterretning er systematisk innsamling, analyse og rapportering av offentlige kilder om parlamentarisk og regjeringsmessig aktivitet — her anvendt på Sveriges Riksdag og Regjering.' },
      { question: 'Hvordan produseres analysene?', answer: 'Hver analyse følger AI-FIRST-prinsippet: en GitHub Copilot-agent produserer en første analyse og leser deretter hele resultatet for å forbedre hvert avsnitt. Minst to fulle iterasjoner kreves.' },
      { question: 'Hva betyr AI-FIRST?', answer: 'AI-FIRST betyr at vi aldri godtar førsteutkastskvalitet. Hver analyse revurderes og forbedres minst én gang til, og arbeidsflyten bruker hele sitt 60-minutters budsjett.' },
      { question: 'Kan kildene revideres?', answer: 'Ja. Hver metodikk, mal og daglig artefakt lenker tilbake til sin kildefil på GitHub. Enhver kan kjøre om det agentbaserte arbeidsflyten og verifisere OSINT/INTOP-kjeden.' },
      { question: 'Hvilke metodikker brukes?', answer: 'Plattformen anvender STRIDE / SWOT / Devil\'s Advocacy / Red Team-analyse pluss Riksdagsmonitor-spesifikke rammeverk (politisk risikoscoring, koalisjonsmatematikk, IMF-økonomisk kontekst).' },
    ],
    newsIndex: [
      { question: 'Hvordan genereres disse artiklene?', answer: 'Hver artikkel produseres av en agentbasert arbeidsflyt som kjører AI-FIRST-piplinen mot analyseartefakter under analysis/daily/YYYY-MM-DD/. Den fulle promptkontrakten ligger i .github/prompts/.' },
      { question: 'Hvor ferske er artiklene?', answer: 'Arbeidsflyter publiserer morgen, midt på dagen, kveld og ukentlig. Den ferskeste artikkelen vises øverst og publiseringstidspunktet vises på hvert kort.' },
      { question: 'Hvorfor er noen artikler kun på engelsk?', answer: 'Analyser skrives først på engelsk og oversettes av news-translate-arbeidsflyten innen 24 timer. Hvis en ikke-engelsk versjon mangler, kom tilbake i morgen.' },
      { question: 'Hvordan abonnerer jeg på strømmen?', answer: 'Hvert språk har sin egen RSS/Atom-strøm (norsk: /rss_no.xml). Legg til URL-en i en RSS-leser for å følge nye artikler automatisk.' },
      { question: 'Er kildene verifiserbare?', answer: 'Ja. Hver artikkel lenker til sine analyseartefakter på GitHub (analysis/daily/YYYY-MM-DD/stream/) og siterer primærkilder fra Riksdag, Regjering og myndigheter med stabile ID-er.' },
    ],
  },

  fi: {
    sitemap: [
      { question: 'Mikä on Riksdagsmonitor?', answer: 'Riksdagsmonitor on avoimen lähdekoodin alusta Ruotsin valtiopäivien poliittiseen tiedusteluun — seuraa äänestyksiä, aloitteita, hallituksen esityksiä, valiokuntamietintöjä ja hallituksen päätöksiä 14 kielellä.' },
      { question: 'Kuinka usein sivukartta päivittyy?', answer: 'Tämä HTML-sivukartta uudelleengeneroidaan jokaisen julkaisun yhteydessä (useita kertoja päivässä). Koneluettava XML-versio löytyy osoitteesta /sitemap.xml.' },
      { question: 'Kuinka vaihdan kieltä?', answer: 'Käytä otsikon kielenvalitsinta tai kunkin osion alalaidan lippulinkkejä. Jokaisella 14 tuetusta kielestä on oma dedicated sitemap page (e.g. sitemap_sv.html)-sivu hreflang-merkinnöin.' },
      { question: 'Mistä löydän XML-sivukartan?', answer: 'Koneluettava XML-sivukartta on osoitteessa /sitemap.xml ja indeksointiohjeet osoitteessa /robots.txt. Molemmat on linkitetty yllä olevasta "Lisäresurssit"-osiosta.' },
      { question: 'Voiko artikkelien lähteet tarkistaa?', answer: 'Kyllä. Jokainen artikkeli linkittää taustalla oleviin analyysiartefakteihin GitHubissa (analysis/daily/YYYY-MM-DD/stream/), joten kuka tahansa lukija voi tarkistaa OSINT-ketjun.' },
    ],
    politicalIntelligence: [
      { question: 'Mitä poliittinen tiedustelu tarkoittaa?', answer: 'Poliittinen tiedustelu on järjestelmällistä julkisten lähteiden keräämistä, analysointia ja raportointia parlamentaarisesta ja hallinnollisesta toiminnasta — tässä sovellettuna Ruotsin valtiopäiviin ja hallitukseen.' },
      { question: 'Miten analyysit tuotetaan?', answer: 'Jokainen analyysi noudattaa AI-FIRST-periaatetta: GitHub Copilot-agentti tuottaa ensimmäisen analyysin ja lukee koko tuloksen uudelleen jalostaakseen jokaista osaa. Vähintään kaksi täyttä iteraatiota vaaditaan.' },
      { question: 'Mitä AI-FIRST tarkoittaa?', answer: 'AI-FIRST tarkoittaa, että emme koskaan hyväksy ensikertalaisuuden laatua. Jokainen analyysi arvioidaan ja parannetaan vähintään kerran, ja työnkulku käyttää koko 60 minuutin budjettinsa.' },
      { question: 'Voiko lähteet tarkistaa?', answer: 'Kyllä. Jokainen menetelmä, malli ja päivittäinen artefakti linkittää takaisin lähdetiedostoonsa GitHubissa. Kuka tahansa voi ajaa työnkulun uudelleen ja tarkistaa OSINT/INTOP-ketjun.' },
      { question: 'Mitä menetelmiä käytetään?', answer: 'Alusta soveltaa STRIDE / SWOT / Devil\'s Advocacy / Red Team-analyysejä sekä Riksdagsmonitor-erityisiä viitekehyksiä (poliittinen riskipisteytys, koalitiomatematiikka, IMF-talouskonteksti).' },
    ],
    newsIndex: [
      { question: 'Miten artikkelit syntyvät?', answer: 'Jokainen artikkeli tuotetaan agenttipohjaisella työnkululla, joka ajaa AI-FIRST-putken analyysiartefakteja vastaan polusta analysis/daily/YYYY-MM-DD/. Promptisopimus on .github/prompts/-kansiossa.' },
      { question: 'Kuinka tuoreita artikkelit ovat?', answer: 'Työnkulut julkaisevat aamuisin, keskipäivällä, iltaisin ja viikoittain. Tuorein artikkeli näkyy ylimpänä, ja julkaisuaika näkyy jokaisessa kortissa.' },
      { question: 'Miksi jotkin artikkelit ovat vain englanniksi?', answer: 'Analyysit kirjoitetaan ensin englanniksi ja käännetään news-translate-työnkululla 24 tunnin kuluessa. Jos käännös puuttuu, palaa huomenna.' },
      { question: 'Miten tilaan syötteen?', answer: 'Jokaisella kielellä on oma RSS/Atom-syötteensä (suomi: /rss_fi.xml). Lisää URL mihin tahansa RSS-lukijaan seurataksesi uusia artikkeleita.' },
      { question: 'Ovatko lähteet todennettavissa?', answer: 'Kyllä. Jokainen artikkeli linkittää analyysiartefakteihinsa GitHubissa (analysis/daily/YYYY-MM-DD/stream/) ja viittaa Valtiopäivien, hallituksen ja viranomaisten ensisijaisiin lähteisiin.' },
    ],
  },

  de: {
    sitemap: [
      { question: 'Was ist Riksdagsmonitor?', answer: 'Riksdagsmonitor ist eine Open-Source-Plattform für politische Aufklärung des schwedischen Reichstags — überwacht Abstimmungen, Anträge, Regierungsvorlagen, Ausschussberichte und Regierungsbeschlüsse in 14 Sprachen.' },
      { question: 'Wie oft wird die Sitemap aktualisiert?', answer: 'Diese HTML-Sitemap wird bei jedem Deployment neu generiert (mehrmals täglich). Die maschinenlesbare XML-Sitemap liegt unter /sitemap.xml und folgt demselben Rhythmus.' },
      { question: 'Wie wechsle ich die Sprache?', answer: 'Nutzen Sie den Sprachwechsler im Header oder die Flaggen-Links am Ende jeder Sektion. Jede der 14 unterstützten Sprachen hat ihre eigene dedicated sitemap page (e.g. sitemap_sv.html) mit hreflang-Annotationen.' },
      { question: 'Wo finde ich die XML-Sitemap?', answer: 'Die maschinenlesbare XML-Sitemap finden Sie unter /sitemap.xml, Crawler-Anweisungen unter /robots.txt. Beide sind im Abschnitt "Weitere Ressourcen" verlinkt.' },
      { question: 'Sind die Artikelquellen prüfbar?', answer: 'Ja. Jeder Artikel verlinkt auf die zugrundeliegenden Analyse-Artefakte auf GitHub (analysis/daily/YYYY-MM-DD/stream/), sodass jeder Leser die OSINT-Kette nachvollziehen kann.' },
    ],
    politicalIntelligence: [
      { question: 'Was ist politische Aufklärung?', answer: 'Politische Aufklärung ist die systematische Erfassung, Analyse und Berichterstattung öffentlicher Quellen zu parlamentarischer und Regierungstätigkeit — hier angewandt auf Riksdag und Regering.' },
      { question: 'Wie werden die Analysen erstellt?', answer: 'Jede Analyse folgt dem AI-FIRST-Prinzip: ein GitHub Copilot-Agent erstellt eine erste Fassung und liest dann das gesamte Ergebnis erneut, um jeden Abschnitt zu verfeinern. Mindestens zwei vollständige Iterationen sind erforderlich.' },
      { question: 'Was bedeutet AI-FIRST?', answer: 'AI-FIRST bedeutet, dass wir keine Erstwurf-Qualität akzeptieren. Jede Analyse wird mindestens einmal neu bewertet und verbessert, und der Workflow nutzt das volle 60-Minuten-Budget.' },
      { question: 'Sind die Quellen prüfbar?', answer: 'Ja. Jede Methodik, Vorlage und tägliche Artefakt-Datei verlinkt zurück auf ihre Quelldatei auf GitHub. Jeder kann den agentischen Workflow erneut ausführen und die OSINT/INTOP-Kette verifizieren.' },
      { question: 'Welche Methodiken werden verwendet?', answer: 'Die Plattform nutzt STRIDE / SWOT / Devil\'s Advocacy / Red Team-Analysen plus Riksdagsmonitor-spezifische Frameworks (politisches Risikoscoring, Koalitionsmathematik, IMF-Wirtschaftskontext).' },
    ],
    newsIndex: [
      { question: 'Wie entstehen diese Artikel?', answer: 'Jeder Artikel wird von einem agentischen Workflow erzeugt, der die AI-FIRST-Pipeline gegen Analyse-Artefakte unter analysis/daily/YYYY-MM-DD/ ausführt. Der vollständige Prompt-Vertrag liegt in .github/prompts/.' },
      { question: 'Wie aktuell sind die Artikel?', answer: 'Workflows veröffentlichen morgens, mittags, abends und wöchentlich. Der neueste Artikel steht oben, und die Veröffentlichungszeit ist auf jeder Karte sichtbar.' },
      { question: 'Warum sind einige Artikel nur auf Englisch verfügbar?', answer: 'Analysen werden zuerst auf Englisch verfasst und vom news-translate-Workflow innerhalb von 24 Stunden übersetzt. Falls eine Übersetzung fehlt, schauen Sie morgen wieder vorbei.' },
      { question: 'Wie abonniere ich den Feed?', answer: 'Jede Sprache hat ihren eigenen RSS/Atom-Feed (Deutsch: /rss_de.xml). Fügen Sie die URL einem RSS-Reader hinzu, um automatisch über neue Artikel informiert zu werden.' },
      { question: 'Sind die Quellen verifizierbar?', answer: 'Ja. Jeder Artikel verlinkt auf seine Analyse-Artefakte auf GitHub (analysis/daily/YYYY-MM-DD/stream/) und zitiert Primärquellen von Riksdag, Regering und Behörden mit stabilen IDs.' },
    ],
  },

  fr: {
    sitemap: [
      { question: 'Qu\'est-ce que Riksdagsmonitor ?', answer: 'Riksdagsmonitor est une plateforme open source de renseignement politique sur le Parlement suédois — surveille votes, motions, projets de loi, rapports de commission et décisions gouvernementales en 14 langues.' },
      { question: 'À quelle fréquence le plan du site est-il mis à jour ?', answer: 'Ce plan HTML est régénéré à chaque déploiement (plusieurs fois par jour). Le plan XML lisible par les machines est publié sur /sitemap.xml et suit le même rythme.' },
      { question: 'Comment changer de langue ?', answer: 'Utilisez le sélecteur de langue dans l\'en-tête ou les liens drapeaux au bas de chaque section. Chacune des 14 langues prises en charge possède son propre dedicated sitemap page (e.g. sitemap_sv.html) avec annotations hreflang.' },
      { question: 'Où trouver le plan du site XML ?', answer: 'Le plan XML lisible par les machines est sur /sitemap.xml et les instructions de crawl sur /robots.txt. Les deux sont liés depuis la section "Ressources supplémentaires" ci-dessus.' },
      { question: 'Les sources des articles sont-elles vérifiables ?', answer: 'Oui. Chaque article renvoie aux artefacts d\'analyse sous-jacents sur GitHub (analysis/daily/YYYY-MM-DD/stream/), permettant à tout lecteur d\'auditer la chaîne OSINT de bout en bout.' },
    ],
    politicalIntelligence: [
      { question: 'Qu\'est-ce que le renseignement politique ?', answer: 'Le renseignement politique est la collecte, l\'analyse et la communication systématiques d\'informations issues de sources ouvertes sur l\'activité parlementaire et gouvernementale — ici appliqué au Riksdag et à la Regering.' },
      { question: 'Comment sont produites les analyses ?', answer: 'Chaque analyse suit le principe AI-FIRST : un agent GitHub Copilot produit une première analyse puis relit l\'intégralité du résultat pour affiner chaque section. Deux itérations complètes minimum sont requises.' },
      { question: 'Que signifie AI-FIRST ?', answer: 'AI-FIRST signifie que nous n\'acceptons jamais une qualité de premier jet. Chaque analyse est réévaluée et améliorée au moins une fois, et le workflow utilise l\'intégralité de son budget de 60 minutes.' },
      { question: 'Les sources sont-elles vérifiables ?', answer: 'Oui. Chaque méthodologie, modèle et artefact quotidien renvoie à son fichier source sur GitHub. Toute personne peut rejouer le workflow agentique et vérifier la chaîne OSINT/INTOP.' },
      { question: 'Quelles méthodologies sont utilisées ?', answer: 'La plateforme applique les analyses STRIDE / SWOT / Devil\'s Advocacy / Red Team plus des cadres spécifiques à Riksdagsmonitor (scoring de risque politique, mathématiques de coalition, contexte économique FMI).' },
    ],
    newsIndex: [
      { question: 'Comment ces articles sont-ils générés ?', answer: 'Chaque article est produit par un workflow agentique qui exécute le pipeline AI-FIRST sur les artefacts d\'analyse publiés sous analysis/daily/YYYY-MM-DD/. Le contrat de prompt complet est dans .github/prompts/.' },
      { question: 'Quel est le degré d\'actualité ?', answer: 'Les workflows publient matin, midi, soir et chaque semaine. L\'article le plus récent est en haut de la liste et l\'horodatage de publication apparaît sur chaque carte.' },
      { question: 'Pourquoi certains articles ne sont-ils qu\'en anglais ?', answer: 'Les analyses sont rédigées d\'abord en anglais puis traduites par le workflow news-translate dans les 24 heures. Si une version n\'est pas encore disponible, repassez demain.' },
      { question: 'Comment m\'abonner au flux ?', answer: 'Chaque langue dispose de son flux RSS/Atom (français : /rss_fr.xml). Ajoutez l\'URL à votre lecteur RSS pour suivre automatiquement les nouveaux articles.' },
      { question: 'Les sources sont-elles vérifiables ?', answer: 'Oui. Chaque article renvoie à ses artefacts d\'analyse sur GitHub (analysis/daily/YYYY-MM-DD/stream/) et cite les sources primaires du Riksdag, de la Regering et des agences avec des ID stables.' },
    ],
  },

  es: {
    sitemap: [
      { question: '¿Qué es Riksdagsmonitor?', answer: 'Riksdagsmonitor es una plataforma de código abierto de inteligencia política sobre el Parlamento sueco — monitoriza votaciones, mociones, propuestas, informes de comisión y decisiones gubernamentales en 14 idiomas.' },
      { question: '¿Con qué frecuencia se actualiza el mapa del sitio?', answer: 'Este mapa HTML se regenera en cada despliegue (varias veces al día). El mapa XML legible por máquinas se publica en /sitemap.xml con la misma cadencia.' },
      { question: '¿Cómo cambio de idioma?', answer: 'Use el selector de idioma de la cabecera o los enlaces con bandera al pie de cada sección. Cada uno de los 14 idiomas soportados tiene su propio dedicated sitemap page (e.g. sitemap_sv.html) con anotaciones hreflang.' },
      { question: '¿Dónde encuentro el mapa XML?', answer: 'El mapa XML legible por máquinas está en /sitemap.xml y las instrucciones de rastreo en /robots.txt. Ambos están enlazados desde la sección "Recursos adicionales" arriba.' },
      { question: '¿Son auditables las fuentes de los artículos?', answer: 'Sí. Cada artículo enlaza a los artefactos de análisis subyacentes en GitHub (analysis/daily/YYYY-MM-DD/stream/), permitiendo a cualquier lector auditar la cadena OSINT de extremo a extremo.' },
    ],
    politicalIntelligence: [
      { question: '¿Qué es la inteligencia política?', answer: 'La inteligencia política es la recopilación, análisis y reporte sistemático de información de fuentes abiertas sobre la actividad parlamentaria y gubernamental — aquí aplicado al Riksdag y a la Regering.' },
      { question: '¿Cómo se generan los análisis?', answer: 'Cada análisis sigue el principio AI-FIRST: un agente GitHub Copilot produce un primer análisis y luego relee toda la salida para refinar cada sección. Se requieren al menos dos iteraciones completas.' },
      { question: '¿Qué significa AI-FIRST?', answer: 'AI-FIRST significa que nunca aceptamos calidad de primera pasada. Cada análisis se reevalúa y mejora al menos una vez, y el flujo de trabajo usa todo su presupuesto de 60 minutos.' },
      { question: '¿Son auditables las fuentes?', answer: 'Sí. Cada metodología, plantilla y artefacto diario enlaza de vuelta a su archivo fuente en GitHub. Cualquiera puede volver a ejecutar el flujo de trabajo agéntico y verificar la cadena OSINT/INTOP.' },
      { question: '¿Qué metodologías se utilizan?', answer: 'La plataforma aplica análisis STRIDE / SWOT / Devil\'s Advocacy / Red Team más marcos específicos de Riksdagsmonitor (puntuación de riesgo político, matemática de coaliciones, contexto económico FMI).' },
    ],
    newsIndex: [
      { question: '¿Cómo se generan estos artículos?', answer: 'Cada artículo es producido por un flujo de trabajo agéntico que ejecuta la canalización AI-FIRST contra los artefactos de análisis publicados en analysis/daily/YYYY-MM-DD/. El contrato completo de prompts está en .github/prompts/.' },
      { question: '¿Qué tan actuales son los artículos?', answer: 'Los flujos publican mañana, mediodía, tarde y semanalmente. El artículo más reciente está en la parte superior y la marca de tiempo de publicación se muestra en cada tarjeta.' },
      { question: '¿Por qué algunos artículos solo están en inglés?', answer: 'Los análisis se escriben primero en inglés y se traducen mediante el flujo news-translate en las 24 horas siguientes. Si falta una versión, vuelva mañana.' },
      { question: '¿Cómo me suscribo al canal?', answer: 'Cada idioma tiene su propio canal RSS/Atom (español: /rss_es.xml). Añada la URL a cualquier lector RSS para seguir los nuevos artículos automáticamente.' },
      { question: '¿Son verificables las fuentes?', answer: 'Sí. Cada artículo enlaza a sus artefactos de análisis en GitHub (analysis/daily/YYYY-MM-DD/stream/) y cita fuentes primarias del Riksdag, la Regering y agencias con identificadores estables.' },
    ],
  },

  nl: {
    sitemap: [
      { question: 'Wat is Riksdagsmonitor?', answer: 'Riksdagsmonitor is een open source-platform voor politieke inlichtingen over het Zweedse parlement — monitort stemmingen, moties, voorstellen, commissieverslagen en regeringsbesluiten in 14 talen.' },
      { question: 'Hoe vaak wordt de sitemap bijgewerkt?', answer: 'Deze HTML-sitemap wordt bij elke deploy opnieuw gegenereerd (meerdere keren per dag). De machine-leesbare XML-versie staat op /sitemap.xml en volgt hetzelfde ritme.' },
      { question: 'Hoe wissel ik van taal?', answer: 'Gebruik de taalkiezer in de header of de vlaglinks onderaan elke sectie. Elk van de 14 ondersteunde talen heeft zijn eigen dedicated sitemap page (e.g. sitemap_sv.html) met hreflang-annotaties.' },
      { question: 'Waar vind ik de XML-sitemap?', answer: 'De machine-leesbare XML-sitemap is te vinden op /sitemap.xml en crawler-instructies op /robots.txt. Beide zijn gelinkt vanuit de sectie "Aanvullende bronnen" hierboven.' },
      { question: 'Zijn de bronnen van artikelen controleerbaar?', answer: 'Ja. Elk artikel linkt naar de onderliggende analyse-artefacten op GitHub (analysis/daily/YYYY-MM-DD/stream/), zodat elke lezer de OSINT-keten kan controleren.' },
    ],
    politicalIntelligence: [
      { question: 'Wat is politieke inlichtingen?', answer: 'Politieke inlichtingen is de systematische verzameling, analyse en rapportage van openbare bronnen over parlementaire en regeringsactiviteit — hier toegepast op de Riksdag en Regering.' },
      { question: 'Hoe worden de analyses gemaakt?', answer: 'Elke analyse volgt het AI-FIRST-principe: een GitHub Copilot-agent maakt een eerste analyse en leest vervolgens de hele output opnieuw om elke sectie te verfijnen. Minimaal twee complete iteraties zijn vereist.' },
      { question: 'Wat betekent AI-FIRST?', answer: 'AI-FIRST betekent dat we nooit eerste-versie kwaliteit accepteren. Elke analyse wordt minstens één keer opnieuw beoordeeld en verbeterd, en de workflow gebruikt zijn volledige 60-minuten budget.' },
      { question: 'Zijn de bronnen controleerbaar?', answer: 'Ja. Elke methodologie, sjabloon en dagelijks artefact linkt terug naar zijn bronbestand op GitHub. Iedereen kan de agentische workflow opnieuw uitvoeren en de OSINT/INTOP-keten verifiëren.' },
      { question: 'Welke methodologieën worden gebruikt?', answer: 'Het platform gebruikt STRIDE / SWOT / Devil\'s Advocacy / Red Team-analyses plus Riksdagsmonitor-specifieke kaders (politieke risicoscoring, coalitiewiskunde, IMF-economische context).' },
    ],
    newsIndex: [
      { question: 'Hoe worden deze artikelen gegenereerd?', answer: 'Elk artikel wordt geproduceerd door een agentische workflow die de AI-FIRST-pijplijn uitvoert tegen analyse-artefacten onder analysis/daily/YYYY-MM-DD/. Het volledige promptcontract staat in .github/prompts/.' },
      { question: 'Hoe actueel zijn de artikelen?', answer: 'Workflows publiceren \'s ochtends, \'s middags, \'s avonds en wekelijks. Het nieuwste artikel staat bovenaan en de publicatietijd wordt op elke kaart weergegeven.' },
      { question: 'Waarom zijn sommige artikelen alleen in het Engels?', answer: 'Analyses worden eerst in het Engels geschreven en vertaald door de news-translate workflow binnen 24 uur. Als een vertaling ontbreekt, kom morgen terug.' },
      { question: 'Hoe abonneer ik me op de feed?', answer: 'Elke taal heeft zijn eigen RSS/Atom-feed (Nederlands: /rss_nl.xml). Voeg de URL toe aan een RSS-lezer om automatisch nieuwe artikelen te volgen.' },
      { question: 'Zijn de bronnen verifieerbaar?', answer: 'Ja. Elk artikel linkt naar zijn analyse-artefacten op GitHub (analysis/daily/YYYY-MM-DD/stream/) en citeert primaire bronnen van Riksdag, Regering en agentschappen met stabiele ID\'s.' },
    ],
  },

  ar: {
    sitemap: [
      { question: 'ما هو Riksdagsmonitor؟', answer: 'Riksdagsmonitor منصة مفتوحة المصدر للاستخبارات السياسية حول البرلمان السويدي — ترصد التصويتات والاقتراحات والمشاريع وتقارير اللجان والقرارات الحكومية بـ14 لغة.' },
      { question: 'كم مرة يتم تحديث خريطة الموقع؟', answer: 'يتم إعادة إنشاء خريطة HTML هذه عند كل نشر (عدة مرات يوميًا). تُنشر النسخة XML القابلة للقراءة آليًا على /sitemap.xml بنفس الوتيرة.' },
      { question: 'كيف أغير اللغة؟', answer: 'استخدم محدد اللغة في الرأس أو روابط الأعلام في أسفل كل قسم. كل من اللغات الـ14 المدعومة لها dedicated sitemap page (e.g. sitemap_sv.html) خاص بها مع تعليقات hreflang.' },
      { question: 'أين أجد خريطة XML؟', answer: 'خريطة XML القابلة للقراءة آليًا على /sitemap.xml، وتعليمات الزواحف على /robots.txt. كلاهما مرتبط من قسم "الموارد الإضافية" أعلاه.' },
      { question: 'هل مصادر المقالات قابلة للتدقيق؟', answer: 'نعم. كل مقال يرتبط بمصنوعات التحليل الأساسية على GitHub (analysis/daily/YYYY-MM-DD/stream/) مما يسمح لأي قارئ بتدقيق سلسلة OSINT.' },
    ],
    politicalIntelligence: [
      { question: 'ما هي الاستخبارات السياسية؟', answer: 'الاستخبارات السياسية هي الجمع المنهجي والتحليل والإبلاغ عن المعلومات من المصادر العامة حول النشاط البرلماني والحكومي — مطبقة هنا على البرلمان والحكومة السويديين.' },
      { question: 'كيف يتم إنشاء التحليلات؟', answer: 'يتبع كل تحليل مبدأ AI-FIRST: ينتج وكيل GitHub Copilot تحليلًا أوليًا ثم يعيد قراءة الناتج بالكامل لتحسين كل قسم. مطلوب تكراران كاملان على الأقل.' },
      { question: 'ماذا يعني AI-FIRST؟', answer: 'AI-FIRST يعني أننا لا نقبل أبدًا جودة الإصدار الأول. كل تحليل يُعاد تقييمه وتحسينه مرة واحدة على الأقل، ويستخدم سير العمل ميزانيته الكاملة 60 دقيقة.' },
      { question: 'هل المصادر قابلة للتدقيق؟', answer: 'نعم. كل منهجية ونموذج ومصنوع يومي يرتبط بملف المصدر على GitHub. يمكن لأي شخص إعادة تشغيل سير العمل الوكيل والتحقق من سلسلة OSINT/INTOP.' },
      { question: 'ما المنهجيات المستخدمة؟', answer: 'تطبق المنصة تحليلات STRIDE / SWOT / Devil\'s Advocacy / Red Team بالإضافة إلى أطر خاصة بـ Riksdagsmonitor (تسجيل المخاطر السياسية، رياضيات الائتلاف، السياق الاقتصادي لصندوق النقد الدولي).' },
    ],
    newsIndex: [
      { question: 'كيف تُنشأ هذه المقالات؟', answer: 'يُنتج كل مقال بواسطة سير عمل وكيل يدير خط أنابيب AI-FIRST مقابل مصنوعات التحليل المنشورة تحت analysis/daily/YYYY-MM-DD/. عقد المطالبة الكامل في .github/prompts/.' },
      { question: 'ما مدى حداثة المقالات؟', answer: 'تنشر سير العمل صباحًا، ظهرًا، مساءً وأسبوعيًا. يظهر المقال الأحدث في الأعلى ووقت النشر على كل بطاقة.' },
      { question: 'لماذا بعض المقالات بالإنجليزية فقط؟', answer: 'تكتب التحليلات أولاً بالإنجليزية وتُترجم بواسطة سير عمل news-translate خلال 24 ساعة. إذا كانت ترجمة مفقودة، عد غدًا.' },
      { question: 'كيف أشترك في الموجز؟', answer: 'كل لغة لها موجز RSS/Atom خاص بها (العربية: /rss_ar.xml). أضف الرابط إلى أي قارئ RSS لمتابعة المقالات الجديدة تلقائيًا.' },
      { question: 'هل المصادر قابلة للتحقق؟', answer: 'نعم. كل مقال يرتبط بمصنوعات التحليل على GitHub (analysis/daily/YYYY-MM-DD/stream/) ويستشهد بمصادر أولية من البرلمان والحكومة والوكالات بمعرفات مستقرة.' },
    ],
  },

  he: {
    sitemap: [
      { question: 'מהו Riksdagsmonitor?', answer: 'Riksdagsmonitor היא פלטפורמת קוד פתוח למודיעין פוליטי על הפרלמנט השוודי — עוקבת אחר הצבעות, הצעות חוק, דוחות ועדה והחלטות ממשלה ב-14 שפות.' },
      { question: 'באיזו תדירות מתעדכנת מפת האתר?', answer: 'מפת ה-HTML הזו נוצרת מחדש בכל פריסה (מספר פעמים ביום). גרסת ה-XML הקריאה למכונה מתפרסמת ב-/sitemap.xml באותו קצב.' },
      { question: 'כיצד אחליף שפה?', answer: 'השתמשו בבורר השפה בכותרת או בקישורי הדגלים בתחתית כל מקטע. לכל אחת מ-14 השפות הנתמכות יש dedicated sitemap page (e.g. sitemap_sv.html) משלה עם אנוטציות hreflang.' },
      { question: 'היכן אמצא את מפת XML?', answer: 'מפת ה-XML הקריאה למכונה נמצאת ב-/sitemap.xml, והוראות סורקים ב-/robots.txt. שניהם מקושרים מסעיף "משאבים נוספים" למעלה.' },
      { question: 'האם מקורות המאמרים ניתנים לאימות?', answer: 'כן. כל מאמר מקשר למוצרי הניתוח הבסיסיים ב-GitHub (analysis/daily/YYYY-MM-DD/stream/) כך שכל קורא יכול לבדוק את שרשרת OSINT.' },
    ],
    politicalIntelligence: [
      { question: 'מהו מודיעין פוליטי?', answer: 'מודיעין פוליטי הוא איסוף, ניתוח ודיווח שיטתיים של מידע ממקורות פתוחים על פעילות פרלמנטרית וממשלתית — כאן מיושם על הפרלמנט והממשלה השוודיים.' },
      { question: 'כיצד מופקים הניתוחים?', answer: 'כל ניתוח עוקב אחר עקרון AI-FIRST: סוכן GitHub Copilot מפיק ניתוח ראשוני ולאחר מכן קורא מחדש את כל הפלט כדי לחדד כל סעיף. נדרשות לפחות שתי איטרציות מלאות.' },
      { question: 'מה משמעות AI-FIRST?', answer: 'AI-FIRST משמעו שלעולם איננו מקבלים איכות מעבר ראשון. כל ניתוח מוערך ומשופר לפחות פעם אחת, ותהליך העבודה משתמש בתקציב המלא של 60 דקות.' },
      { question: 'האם המקורות ניתנים לאימות?', answer: 'כן. כל מתודולוגיה, תבנית ופריט יומי מקשרים חזרה לקובץ המקור ב-GitHub. כל אחד יכול להריץ מחדש את תהליך הסוכן ולוודא את שרשרת OSINT/INTOP.' },
      { question: 'אילו מתודולוגיות בשימוש?', answer: 'הפלטפורמה משתמשת בניתוחי STRIDE / SWOT / Devil\'s Advocacy / Red Team בנוסף למסגרות ייחודיות ל-Riksdagsmonitor (ניקוד סיכונים פוליטי, מתמטיקת קואליציה, הקשר כלכלי של קרן המטבע).' },
    ],
    newsIndex: [
      { question: 'כיצד נוצרים המאמרים האלה?', answer: 'כל מאמר מופק על ידי תהליך סוכן המריץ את צינור ה-AI-FIRST כנגד פריטי הניתוח שפורסמו תחת analysis/daily/YYYY-MM-DD/. חוזה הנחיה מלא ב-.github/prompts/.' },
      { question: 'עד כמה המאמרים עדכניים?', answer: 'תהליכי עבודה מפרסמים בבוקר, בצהריים, בערב ובכל שבוע. המאמר העדכני ביותר נמצא בראש הרשימה וזמן הפרסום מוצג בכל כרטיס.' },
      { question: 'מדוע חלק מהמאמרים זמינים רק באנגלית?', answer: 'הניתוחים נכתבים תחילה באנגלית ומתורגמים על ידי תהליך news-translate תוך 24 שעות. אם תרגום חסר, חזרו מחר.' },
      { question: 'כיצד אירשם להזנה?', answer: 'לכל שפה הזנת RSS/Atom משלה (עברית: /rss_he.xml). הוסיפו את הכתובת לכל קורא RSS כדי לעקוב אחרי מאמרים חדשים אוטומטית.' },
      { question: 'האם המקורות ניתנים לאימות?', answer: 'כן. כל מאמר מקשר למוצרי הניתוח שלו ב-GitHub (analysis/daily/YYYY-MM-DD/stream/) ומצטט מקורות ראשוניים מהפרלמנט, הממשלה והסוכנויות עם מזהים יציבים.' },
    ],
  },

  ja: {
    sitemap: [
      { question: 'Riksdagsmonitorとは？', answer: 'Riksdagsmonitorはスウェーデン議会の政治インテリジェンス向けオープンソースプラットフォームです。投票、動議、法案、委員会報告、政府決定を14言語でリアルタイム監視します。' },
      { question: 'サイトマップはどのくらいの頻度で更新されますか？', answer: 'このHTMLサイトマップは各デプロイ時に再生成されます（1日に複数回）。機械可読のXML版は/sitemap.xmlで同じ頻度で公開されます。' },
      { question: '言語の切り替え方は？', answer: 'ヘッダーの言語切替または各セクション下部の国旗リンクを使用してください。サポートされている14言語それぞれに、hreflang注釈付きのdedicated sitemap page (e.g. sitemap_sv.html)があります。' },
      { question: 'XMLサイトマップはどこにありますか？', answer: '機械可読のXMLサイトマップは/sitemap.xmlにあり、クローラー指示は/robots.txtにあります。両方とも上の「追加リソース」セクションからリンクされています。' },
      { question: '記事の出典は監査可能ですか？', answer: 'はい。各記事はGitHub上の基となる分析アーティファクト（analysis/daily/YYYY-MM-DD/stream/）にリンクしており、誰でもOSINTチェーンを最初から最後まで監査できます。' },
    ],
    politicalIntelligence: [
      { question: '政治インテリジェンスとは？', answer: '政治インテリジェンスとは、議会および政府活動に関する公開ソース情報を体系的に収集、分析、報告することで、ここではスウェーデン議会と政府に適用されています。' },
      { question: '分析はどのように生成されますか？', answer: '各分析はAI-FIRST原則に従います。GitHub Copilotエージェントが初稿を作成し、その後出力全体を再読して各セクションを洗練します。最低2回の完全な反復が必要です。' },
      { question: 'AI-FIRSTとは何ですか？', answer: 'AI-FIRSTとは初稿の品質を決して受け入れないことを意味します。各分析は少なくとも1回再評価・改善され、ワークフローは60分の予算を完全に使い切ります。' },
      { question: '出典は監査可能ですか？', answer: 'はい。各方法論、テンプレート、日次アーティファクトはGitHubのソースファイルにリンクしています。誰でもエージェントワークフローを再実行してOSINT/INTOPチェーンを検証できます。' },
      { question: 'どのような方法論が使われていますか？', answer: 'プラットフォームはSTRIDE / SWOT / Devil\'s Advocacy / Red Team分析に加え、Riksdagsmonitor固有のフレームワーク（政治リスクスコアリング、連立数学、IMF経済コンテキスト）を適用します。' },
    ],
    newsIndex: [
      { question: 'これらの記事はどのように生成されますか？', answer: '各記事は、analysis/daily/YYYY-MM-DD/配下の分析アーティファクトに対してAI-FIRSTパイプラインを実行するエージェントワークフローによって生成されます。完全なプロンプト契約は.github/prompts/にあります。' },
      { question: '記事はどのくらい新しいですか？', answer: 'ワークフローは朝、昼、夜、週次で公開します。最新の記事がリストの最上部にあり、公開時刻は各カードに表示されます。' },
      { question: 'なぜ一部の記事は英語のみですか？', answer: '分析はまず英語で書かれ、24時間以内にnews-translateワークフローによって翻訳されます。翻訳が欠けている場合は明日もう一度ご覧ください。' },
      { question: 'フィードを購読するには？', answer: '各言語に独自のRSS/Atomフィードがあります（日本語：/rss_ja.xml）。任意のRSSリーダーにURLを追加して新しい記事を自動的にフォローしてください。' },
      { question: '出典は検証可能ですか？', answer: 'はい。各記事はGitHub上の分析アーティファクト（analysis/daily/YYYY-MM-DD/stream/）にリンクし、議会、政府、機関の一次資料を安定したIDで引用しています。' },
    ],
  },

  ko: {
    sitemap: [
      { question: 'Riksdagsmonitor란?', answer: 'Riksdagsmonitor는 스웨덴 의회 정치 정보를 위한 오픈소스 플랫폼입니다. 투표, 발의안, 법안, 위원회 보고서, 정부 결정을 14개 언어로 실시간 모니터링합니다.' },
      { question: '사이트맵은 얼마나 자주 업데이트되나요?', answer: '이 HTML 사이트맵은 매 배포 시 재생성됩니다(하루에 여러 번). 기계 판독 가능한 XML 버전은 /sitemap.xml에서 동일한 주기로 게시됩니다.' },
      { question: '언어를 어떻게 변경하나요?', answer: '헤더의 언어 선택기 또는 각 섹션 하단의 국기 링크를 사용하세요. 지원되는 14개 언어 각각에 hreflang 주석이 포함된 dedicated sitemap page (e.g. sitemap_sv.html)이 있습니다.' },
      { question: 'XML 사이트맵은 어디에 있나요?', answer: '기계 판독 가능한 XML 사이트맵은 /sitemap.xml에 있고 크롤러 지침은 /robots.txt에 있습니다. 둘 다 위의 "추가 리소스" 섹션에서 연결되어 있습니다.' },
      { question: '기사의 출처는 감사 가능한가요?', answer: '예. 각 기사는 GitHub의 기본 분석 아티팩트(analysis/daily/YYYY-MM-DD/stream/)에 연결되어 있어 모든 독자가 OSINT 체인을 처음부터 끝까지 감사할 수 있습니다.' },
    ],
    politicalIntelligence: [
      { question: '정치 정보란 무엇인가요?', answer: '정치 정보란 의회 및 정부 활동에 관한 공개 소스 정보의 체계적 수집, 분석, 보고이며, 여기서는 스웨덴 의회 및 정부에 적용됩니다.' },
      { question: '분석은 어떻게 생성되나요?', answer: '각 분석은 AI-FIRST 원칙을 따릅니다. GitHub Copilot 에이전트가 첫 번째 분석을 생성한 다음 전체 출력을 다시 읽어 각 섹션을 다듬습니다. 최소 두 번의 완전한 반복이 필요합니다.' },
      { question: 'AI-FIRST란 무엇인가요?', answer: 'AI-FIRST는 첫 번째 통과 품질을 결코 받아들이지 않는다는 의미입니다. 각 분석은 최소 한 번 재평가되고 개선되며, 워크플로는 60분 예산 전체를 사용합니다.' },
      { question: '출처는 감사 가능한가요?', answer: '예. 각 방법론, 템플릿 및 일일 아티팩트는 GitHub의 소스 파일에 다시 연결됩니다. 누구나 에이전트 워크플로를 다시 실행하여 OSINT/INTOP 체인을 확인할 수 있습니다.' },
      { question: '어떤 방법론이 사용되나요?', answer: '플랫폼은 STRIDE / SWOT / Devil\'s Advocacy / Red Team 분석과 Riksdagsmonitor 고유 프레임워크(정치 위험 점수, 연합 수학, IMF 경제 컨텍스트)를 적용합니다.' },
    ],
    newsIndex: [
      { question: '이 기사들은 어떻게 생성되나요?', answer: '각 기사는 analysis/daily/YYYY-MM-DD/ 아래에 게시된 분석 아티팩트에 대해 AI-FIRST 파이프라인을 실행하는 에이전트 워크플로에 의해 생성됩니다. 전체 프롬프트 계약은 .github/prompts/에 있습니다.' },
      { question: '기사는 얼마나 최신인가요?', answer: '워크플로는 아침, 정오, 저녁, 주간으로 게시합니다. 가장 최신 기사가 맨 위에 있으며 각 카드에 게시 타임스탬프가 표시됩니다.' },
      { question: '왜 일부 기사는 영어로만 제공되나요?', answer: '분석은 먼저 영어로 작성되고 24시간 이내에 news-translate 워크플로에 의해 번역됩니다. 번역이 누락된 경우 내일 다시 확인하세요.' },
      { question: '피드를 어떻게 구독하나요?', answer: '각 언어에는 자체 RSS/Atom 피드가 있습니다(한국어: /rss_ko.xml). 모든 RSS 리더에 URL을 추가하여 새 기사를 자동으로 따라가세요.' },
      { question: '출처는 검증 가능한가요?', answer: '예. 각 기사는 GitHub의 분석 아티팩트(analysis/daily/YYYY-MM-DD/stream/)에 연결되며 의회, 정부, 기관의 1차 출처를 안정적인 ID로 인용합니다.' },
    ],
  },

  zh: {
    sitemap: [
      { question: '什么是 Riksdagsmonitor？', answer: 'Riksdagsmonitor 是一个面向瑞典议会政治情报的开源平台 — 以14种语言实时监控投票、动议、法案、委员会报告和政府决策。' },
      { question: '站点地图多久更新一次？', answer: '此 HTML 站点地图在每次部署时重新生成（每天多次）。机器可读的 XML 版本发布在 /sitemap.xml 上，遵循相同的节奏。' },
      { question: '如何切换语言？', answer: '使用头部的语言选择器或每个部分底部的国旗链接。支持的14种语言中每一种都有自己的 dedicated sitemap page (e.g. sitemap_sv.html)，带有 hreflang 注释。' },
      { question: '在哪里可以找到 XML 站点地图？', answer: '机器可读的 XML 站点地图位于 /sitemap.xml，爬虫指令位于 /robots.txt。两者都从上方"附加资源"部分链接。' },
      { question: '文章来源可审计吗？', answer: '是的。每篇文章都链接到 GitHub 上的底层分析产物（analysis/daily/YYYY-MM-DD/stream/），使任何读者都能端到端审计 OSINT 链。' },
    ],
    politicalIntelligence: [
      { question: '什么是政治情报？', answer: '政治情报是对议会和政府活动的公开来源信息进行系统收集、分析和报告 — 此处应用于瑞典议会和政府。' },
      { question: '如何生成分析？', answer: '每项分析遵循 AI-FIRST 原则：GitHub Copilot 代理生成初次分析，然后重新阅读整个输出以完善每个部分。至少需要两次完整迭代。' },
      { question: 'AI-FIRST 是什么意思？', answer: 'AI-FIRST 意味着我们绝不接受一次通过的质量。每项分析至少重新评估和改进一次，工作流使用其全部60分钟预算。' },
      { question: '来源可审计吗？', answer: '是的。每个方法论、模板和日常产物都链接回 GitHub 上的源文件。任何人都可以重新运行代理工作流并验证 OSINT/INTOP 链。' },
      { question: '使用了哪些方法论？', answer: '平台应用 STRIDE / SWOT / Devil\'s Advocacy / Red Team 分析以及 Riksdagsmonitor 特定框架（政治风险评分、联盟数学、IMF 经济背景）。' },
    ],
    newsIndex: [
      { question: '这些文章是如何生成的？', answer: '每篇文章由代理工作流生成，该工作流针对 analysis/daily/YYYY-MM-DD/ 下发布的分析产物运行 AI-FIRST 管道。完整的提示合约位于 .github/prompts/。' },
      { question: '文章有多新？', answer: '工作流在早晨、中午、傍晚和每周发布。最新文章位于列表顶部，每张卡片上都显示发布时间戳。' },
      { question: '为什么有些文章只有英文？', answer: '分析首先用英文撰写，并在24小时内由 news-translate 工作流翻译。如果翻译缺失，请明天再来。' },
      { question: '如何订阅源？', answer: '每种语言都有自己的 RSS/Atom 源（中文：/rss_zh.xml）。将 URL 添加到任何 RSS 阅读器以自动关注新文章。' },
      { question: '来源可验证吗？', answer: '是的。每篇文章都链接到 GitHub 上的分析产物（analysis/daily/YYYY-MM-DD/stream/），并以稳定的 ID 引用议会、政府和机构的主要来源。' },
    ],
  },
};

/**
 * Convenience getter — returns the FAQ list for a (catalogue, language)
 * pair, falling back to English if a translation is missing (defensive
 * — every language is currently populated).
 */
export function getFaqItems(
  catalogue: FAQCatalogueKey,
  lang: Language,
): readonly FAQItem[] {
  return FAQ_I18N[lang]?.[catalogue] ?? FAQ_I18N.en[catalogue];
}

/**
 * Localised FAQ section heading. Used by sitemap, political-intelligence
 * and news-index page renderers so the `<h2>` matches the page language.
 */
export const FAQ_HEADING: Record<Language, string> = {
  en: 'Frequently Asked Questions',
  sv: 'Vanliga frågor',
  da: 'Ofte stillede spørgsmål',
  no: 'Ofte stilte spørsmål',
  fi: 'Usein kysytyt kysymykset',
  de: 'Häufig gestellte Fragen',
  fr: 'Questions fréquentes',
  es: 'Preguntas frecuentes',
  nl: 'Veelgestelde vragen',
  ar: 'الأسئلة الشائعة',
  he: 'שאלות נפוצות',
  ja: 'よくある質問',
  ko: '자주 묻는 질문',
  zh: '常见问题',
};
