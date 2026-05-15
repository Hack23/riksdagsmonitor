import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import {
  extractPollingWaveFromHtml,
  buildPollingAggregate,
  fetchPollingContext,
  persistPollingContext,
} from '../scripts/polling-fetch.js';

const schema = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'schemas', 'polling-context.schema.json'), 'utf8'));

describe('polling-fetch', () => {
  it('extracts a polling wave from provider HTML and computes aggregate means', () => {
    const html = `
      <html><head><title>Novus väljarbarometer 2026-05-14</title></head><body>
        <p>2026-05-14</p>
        <p>Urval 2048</p>
        <p>S 31.2% M 18.4% SD 20.1% V 7.9% MP 5.8% C 4.4% L 3.1% KD 4.8%</p>
      </body></html>`;
    const wave = extractPollingWaveFromHtml('novus', 'https://example.test/novus', html, '2026-05-15T00:00:00Z');
    const aggregate = buildPollingAggregate([wave]);

    expect(wave.status).toBe('ok');
    expect(wave.sampleSize).toBe(2048);
    expect(wave.parties.S).toBe(31.2);
    expect(aggregate.availableProviders).toBe(1);
    expect(aggregate.parties.S?.mean).toBe(31.2);
  });

  it('persists schema-valid polling context output', async () => {
    const context = await fetchPollingContext({
      providers: [{ provider: 'sifo', url: 'https://example.test/sifo' }],
      fetchFn: (async () => new Response('<html><title>Sifo</title><body>S 30.0% M 20.0% SD 18.0% V 8.0%</body></html>', { status: 200 })) as typeof fetch,
      now: () => '2026-05-15T00:00:00Z',
    });
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'polling-fetch-'));
    const output = path.join(tmpDir, 'polling-context.json');
    persistPollingContext(context, output);

    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const persisted = JSON.parse(fs.readFileSync(output, 'utf8'));

    expect(validate(persisted), JSON.stringify(validate.errors)).toBe(true);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('validates the committed _fixture placeholder against the schema', () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data', 'polling-context.json'), 'utf8'),
    );
    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    expect(validate(fixture), JSON.stringify(validate.errors)).toBe(true);
    expect(fixture._fixture).toBe('unavailable');
    expect(typeof fixture._note).toBe('string');
  });

  it('prefers discovered follow-up article before extracting from archive roots', async () => {
    const archiveUrl = 'https://example.test/valjarbarometer-arkiv/';
    const articleUrl = 'https://example.test/valjarbarometer-2026-05/';
    const archiveHtml = `
      <html><body>
        <a href="${articleUrl}">Valjarbarometer maj 2026</a>
        <p>S 11.0% M 11.0% SD 11.0% V 11.0%</p>
      </body></html>`;
    const articleHtml = '<html><body><p>S 31.5% M 19.2% SD 20.4% V 8.4%</p></body></html>';
    const fetchFn = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === archiveUrl) {
        return new Response(archiveHtml, { status: 200 });
      }
      if (url === articleUrl) {
        return new Response(articleHtml, { status: 200 });
      }
      return new Response('', { status: 404, statusText: 'Not Found' });
    }) as typeof fetch;

    const context = await fetchPollingContext({
      providers: [{ provider: 'novus', url: archiveUrl }],
      fetchFn,
      now: () => '2026-05-15T00:00:00Z',
    });

    expect(context.providers).toHaveLength(1);
    expect(context.providers[0]?.status).toBe('ok');
    expect(context.providers[0]?.sourceUrl).toBe(articleUrl);
    expect(context.providers[0]?.parties.S).toBe(31.5);
  });
});
