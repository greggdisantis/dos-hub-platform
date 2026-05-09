import { MODULE_KEY } from '../../../../../packages/domain/src/motorizedScreens';

type SavedSubmission = {
  submissionId: string;
  projectName: string;
  header: {
    projectName: string;
    date: string;
    address: string;
    submitter: string;
    screenManufacturer: string;
    totalNumberOfScreens: number;
  };
  screens: Array<any>;
};

const textEncoder = new TextEncoder();
const PDF_HEADER = textEncoder.encode('%PDF-1.4\n');
const PDF_EOF = textEncoder.encode('%%EOF');

function sanitizePdfTextValue(input: unknown): string {
  const text = String(input ?? '');
  const noControl = text.replace(/[\u0000-\u001F\u007F]/g, ' ');
  const asciiSafe = noControl.replace(/[^\x20-\x7E]/g, '?');
  return asciiSafe.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function line(label: string, value: unknown): string {
  return `${label}: ${sanitizePdfTextValue(value)}`;
}

function screenLines(screen: any): string[] {
  const raw = screen.section6?.rawMeasurements || {};
  const calc = screen.section6?.calcSummary || {};
  return [
    `Screen # ${sanitizePdfTextValue(screen.screenNumber)}`,
    'Section 1: Screen & Frame Config',
    sanitizePdfTextValue(JSON.stringify(screen.section1 || {})),
    'Section 2: Motor Config',
    sanitizePdfTextValue(JSON.stringify(screen.section2 || {})),
    'Section 3: Order Measurements',
    sanitizePdfTextValue(JSON.stringify(screen.section3 || {})),
    'Section 4: Materials',
    sanitizePdfTextValue(JSON.stringify(screen.section4 || {})),
    'Section 5: Misc',
    sanitizePdfTextValue(JSON.stringify(screen.section5 || {})),
    'Section 6: Raw Measurements + Calc Summary',
    `UL:${raw.UL ?? ''} LL:${raw.LL ?? ''} OL:${raw.OL ?? ''} UR:${raw.UR ?? ''} LR:${raw.LR ?? ''} OR:${raw.OR ?? ''} T:${raw.T ?? ''} M:${raw.M ?? ''} B:${raw.B ?? ''}`,
    `Upper Slope:${calc.upperSlope ?? ''} Slope Direction:${calc.slopeDirection ?? ''} High Side:${calc.highSide ?? ''} Low Side:${calc.lowSide ?? ''} T-B Diff:${calc.tbDiff ?? ''}`,
    'Section 7: Attachments',
    `Attachment IDs: ${(screen.section7?.attachmentIds || []).join(', ') || '(none)'}`,
  ].map(sanitizePdfTextValue);
}

function buildPages(submission: SavedSubmission): string[][] {
  const header = submission.header;
  const pages: string[][] = [[
    'Motorized Screens - Ordering Tool',
    line('Project Name', header.projectName),
    line('Date', header.date),
    line('Address', header.address),
    line('Submitter', header.submitter),
    line('Screen Manufacturer', header.screenManufacturer),
    line('Total # of Screens', header.totalNumberOfScreens),
  ]];

  submission.screens.forEach((screen) => {
    pages.push(screenLines(screen));
    pages.push([
      sanitizePdfTextValue(`Attachments for Screen # ${screen.screenNumber}`),
      sanitizePdfTextValue(`Attachment IDs: ${(screen.section7?.attachmentIds || []).join(', ') || '(none)'}`),
    ]);
  });

  return pages;
}

function textObjectBytes(lines: string[]): Uint8Array {
  const contentLines: string[] = ['BT', '/F1 11 Tf', '36 800 Td'];
  for (let i = 0; i < lines.length; i += 1) {
    contentLines.push(`(${lines[i]}) Tj`);
    if (i < lines.length - 1) contentLines.push('0 -14 Td');
  }
  contentLines.push('ET');
  return textEncoder.encode(contentLines.join('\n'));
}

export function buildMotorizedScreensPdf(submission: SavedSubmission): Uint8Array {
  const pages = buildPages(submission);
  const objects: Uint8Array[] = [];

  objects[1] = textEncoder.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const pageObjectIds: number[] = [];
  let objIndex = 2;

  for (const lines of pages) {
    const streamBytes = textObjectBytes(lines);

    const contentId = objIndex++;
    const contentPrefix = textEncoder.encode(`<< /Length ${streamBytes.byteLength} >>\nstream\n`);
    const contentSuffix = textEncoder.encode('\nendstream');
    const contentObj = new Uint8Array(contentPrefix.byteLength + streamBytes.byteLength + contentSuffix.byteLength);
    contentObj.set(contentPrefix, 0);
    contentObj.set(streamBytes, contentPrefix.byteLength);
    contentObj.set(contentSuffix, contentPrefix.byteLength + streamBytes.byteLength);
    objects[contentId] = contentObj;

    const pageId = objIndex++;
    objects[pageId] = textEncoder.encode(`<< /Type /Page /Parent PAGES_PARENT /MediaBox [0 0 612 842] /Resources << /Font << /F1 1 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageObjectIds.push(pageId);
  }

  const pagesId = objIndex++;
  objects[pagesId] = textEncoder.encode(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`);

  for (const pageId of pageObjectIds) {
    const patched = new TextDecoder().decode(objects[pageId]).replace('PAGES_PARENT', `${pagesId} 0 R`);
    objects[pageId] = textEncoder.encode(patched);
  }

  const catalogId = objIndex++;
  objects[catalogId] = textEncoder.encode(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const chunks: Uint8Array[] = [PDF_HEADER];
  const offsets: number[] = [0];
  let cursor = PDF_HEADER.byteLength;

  for (let i = 1; i < objIndex; i += 1) {
    offsets[i] = cursor;
    const prefix = textEncoder.encode(`${i} 0 obj\n`);
    const suffix = textEncoder.encode('\nendobj\n');
    chunks.push(prefix, objects[i], suffix);
    cursor += prefix.byteLength + objects[i].byteLength + suffix.byteLength;
  }

  const xrefPos = cursor;
  const xrefHead = textEncoder.encode(`xref\n0 ${objIndex}\n0000000000 65535 f \n`);
  chunks.push(xrefHead);
  cursor += xrefHead.byteLength;
  for (let i = 1; i < objIndex; i += 1) {
    const row = textEncoder.encode(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    chunks.push(row);
    cursor += row.byteLength;
  }

  const trailer = textEncoder.encode(`trailer\n<< /Size ${objIndex} /Root ${catalogId} 0 R >>\nstartxref\n${xrefPos}\n`);
  chunks.push(trailer, PDF_EOF);

  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export function buildMotorizedScreensPdfFileName(projectName: string, submissionId: string): string {
  const sanitizedProject = projectName
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ /g, '_')
    .slice(0, 80) || 'project';

  return `${sanitizedProject}__${MODULE_KEY}__${submissionId}.pdf`;
}
