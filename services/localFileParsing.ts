import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { readFileAsText } from '../utils/helpers';

// Configure pdf.js worker using the bundled worker from pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Extract text from a PDF file using pdf.js (runs entirely in the browser).
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  if (pages.length === 0) {
    throw new Error(
      'No extractable text found in PDF. It may be a scanned document (image-only). AI-based OCR will be attempted as a fallback.'
    );
  }
  return pages.join('\n\n');
}

/**
 * Extract text from an EPUB file.
 * EPUBs are ZIP archives containing XHTML content files.
 */
export async function extractEpubText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Find the OPF file via META-INF/container.xml
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) {
    throw new Error('Invalid EPUB: missing META-INF/container.xml');
  }

  const rootfileMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!rootfileMatch) {
    throw new Error('Invalid EPUB: cannot find rootfile path in container.xml');
  }

  const opfPath = rootfileMatch[1];
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // 2. Parse the OPF to get the reading order (spine + manifest)
  const opfContent = await zip.file(opfPath)?.async('string');
  if (!opfContent) {
    throw new Error('Invalid EPUB: cannot read OPF file');
  }

  // Build manifest map: id -> href
  const manifest: Record<string, string> = {};
  const itemRegex = /<item\s[^>]*?id="([^"]+)"[^>]*?href="([^"]+)"[^>]*?\/?>/g;
  let match;
  while ((match = itemRegex.exec(opfContent)) !== null) {
    manifest[match[1]] = match[2];
  }

  // Get spine order
  const spineIds: string[] = [];
  const spineItemRegex = /<itemref\s[^>]*?idref="([^"]+)"[^>]*?\/?>/g;
  while ((match = spineItemRegex.exec(opfContent)) !== null) {
    spineIds.push(match[1]);
  }

  // 3. Read content files in spine order and extract text
  const sections: string[] = [];
  for (const id of spineIds) {
    const href = manifest[id];
    if (!href) continue;

    const filePath = opfDir + decodeURIComponent(href);
    const contentFile = zip.file(filePath);
    if (!contentFile) continue;

    const html = await contentFile.async('string');
    const text = stripHtmlTags(html);
    if (text.trim()) {
      sections.push(text.trim());
    }
  }

  if (sections.length === 0) {
    throw new Error('No readable text content found in EPUB.');
  }

  return sections.join('\n\n');
}

/**
 * Extract text from a DOCX file.
 * DOCX files are ZIP archives containing XML (word/document.xml).
 */
export async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('Invalid DOCX: missing word/document.xml');
  }

  // Extract text from <w:t> elements, grouping by paragraph <w:p>
  const paragraphs: string[] = [];
  const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let paraMatch;

  while ((paraMatch = paraRegex.exec(documentXml)) !== null) {
    const paraXml = paraMatch[0];
    const textParts: string[] = [];
    const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let textMatch;

    while ((textMatch = textRegex.exec(paraXml)) !== null) {
      textParts.push(textMatch[1]);
    }

    if (textParts.length > 0) {
      paragraphs.push(textParts.join(''));
    }
  }

  if (paragraphs.length === 0) {
    throw new Error('No extractable text found in DOCX file.');
  }

  return paragraphs.join('\n');
}

/**
 * Strip HTML/XML tags and decode common entities, returning plain text.
 */
function stripHtmlTags(html: string): string {
  return html
    // Remove script and style blocks
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Add newlines for block elements
    .replace(/<\/(p|div|h[1-6]|li|tr|br\s*\/?)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Try to parse a file locally without AI. Returns the text content,
 * or throws an error if local parsing is not possible / yields no text.
 */
export async function tryLocalParse(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type;

  // PDF
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      return await extractPdfText(file);
    } catch (e: any) {
      console.warn(`Local PDF parsing failed for ${file.name}:`, e.message);
      // Return null to allow AI fallback (e.g. for scanned PDFs)
      return null;
    }
  }

  // EPUB
  if (mimeType === 'application/epub+zip' || ext === 'epub') {
    return await extractEpubText(file);
  }

  // DOCX
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return await extractDocxText(file);
  }

  // Not a locally-parseable binary format
  return null;
}
