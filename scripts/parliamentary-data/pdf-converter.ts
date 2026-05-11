/**
 * @module parliamentary-data/pdf-converter
 * @description Converts binary document formats (PDF) to text or markdown.
 *
 * Uses system tools when available:
 *   1. `pdftotext` (poppler-utils) — preferred, preserves layout
 *   2. Returns an error with install instructions when no system tools are found
 *
 * This module only returns converted text — callers are responsible for
 * persisting the output (e.g. as `.txt` or `.md` files).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversionResult {
  /** Whether conversion succeeded. */
  success: boolean;
  /** Converted text content (empty on failure). */
  text: string;
  /** Tool used for conversion. */
  tool: 'pdftotext' | 'none';
  /** Error message if conversion failed. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Tool detection
// ---------------------------------------------------------------------------

let _pdftotextAvailable: boolean | null = null;

/**
 * Check if `pdftotext` (from poppler-utils) is available on the system.
 * Caches the result after first check.
 */
export function isPdfToTextAvailable(): boolean {
  if (_pdftotextAvailable !== null) return _pdftotextAvailable;
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'pipe', timeout: 5000 });
    _pdftotextAvailable = true;
  } catch {
    _pdftotextAvailable = false;
  }
  return _pdftotextAvailable;
}

/**
 * Reset the cached availability check (for testing).
 */
export function resetPdfToolCache(): void {
  _pdftotextAvailable = null;
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * Convert a PDF file to text using the best available tool.
 *
 * @param pdfPath - Absolute path to the PDF file.
 * @returns Conversion result with text content.
 */
export function convertPdfToText(pdfPath: string): ConversionResult {
  if (!fs.existsSync(pdfPath)) {
    return { success: false, text: '', tool: 'none', error: `File not found: ${pdfPath}` };
  }

  if (isPdfToTextAvailable()) {
    try {
      const text = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, '-'], {
        encoding: 'utf8',
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024, // 10 MB
      });
      return { success: true, text: text.trim(), tool: 'pdftotext' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, text: '', tool: 'pdftotext', error: `pdftotext failed: ${msg}` };
    }
  }

  return {
    success: false,
    text: '',
    tool: 'none',
    error: 'No PDF conversion tool available. Install poppler-utils: apt-get install poppler-utils',
  };
}

/**
 * Convert a PDF buffer (in-memory) to text.
 * Writes to a temp file, converts, then cleans up.
 *
 * @param pdfBuffer - PDF content as a Buffer.
 * @param tempDir   - Directory for temporary file storage.
 * @returns Conversion result with text content.
 */
export function convertPdfBufferToText(
  pdfBuffer: Buffer,
  tempDir: string = os.tmpdir(),
): ConversionResult {
  const tempFile = path.join(tempDir, `riksdag-pdf-${crypto.randomUUID()}.pdf`);
  try {
    fs.writeFileSync(tempFile, pdfBuffer);
    return convertPdfToText(tempFile);
  } finally {
    try { fs.unlinkSync(tempFile); } catch { /* temp file cleanup is best-effort */ }
  }
}

/** Minimum character length for a line to be considered a heading candidate. */
const MIN_HEADING_LENGTH = 3;
/** Maximum character length for a heading line (longer lines are likely paragraphs). */
const MAX_HEADING_LENGTH = 120;

/**
 * Convert PDF text output to a simple markdown format.
 * Applies basic heuristics:
 *   - Lines that look like headings (ALL CAPS, short) become ## headings
 *   - Preserves paragraph breaks
 *   - Normalises whitespace
 */
export function textToMarkdown(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      continue;
    }

    if (
      trimmed.length > MIN_HEADING_LENGTH &&
      trimmed.length < MAX_HEADING_LENGTH &&
      trimmed === trimmed.toUpperCase() &&
      /[A-ZÅÄÖ]/.test(trimmed)
    ) {
      result.push('');
      result.push(`## ${trimmed}`);
      result.push('');
      continue;
    }

    result.push(trimmed);
  }

  return result.join('\n').trim();
}
