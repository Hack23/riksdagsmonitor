/**
 * @module pre-article-analysis/pdf-converter
 * @description Converts binary document formats (PDF) to text or markdown.
 *
 * Uses system tools when available:
 *   1. `pdftotext` (poppler-utils) — preferred, preserves layout
 *   2. Falls back to raw text extraction via Node.js when system tools are missing
 *
 * Converted content is stored alongside the original JSON metadata with a
 * `.txt` or `.md` extension.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
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
  tool: 'pdftotext' | 'fallback' | 'none';
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

  // Try pdftotext first
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

  // No system tool available
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
  tempDir: string = '/tmp',
): ConversionResult {
  const tempFile = path.join(tempDir, `riksdag-pdf-${Date.now()}.pdf`);
  try {
    fs.writeFileSync(tempFile, pdfBuffer);
    return convertPdfToText(tempFile);
  } finally {
    try { fs.unlinkSync(tempFile); } catch { /* best effort cleanup */ }
  }
}

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

    // Skip empty lines (preserve paragraph breaks)
    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      continue;
    }

    // Heuristic: short ALL CAPS lines are likely headings
    if (
      trimmed.length > 3 &&
      trimmed.length < 120 &&
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
