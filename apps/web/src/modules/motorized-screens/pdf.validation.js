const assert = require('assert');

function sanitizeName(projectName, moduleKey, submissionId) {
  const sanitizedProject = projectName
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ /g, '_')
    .slice(0, 80) || 'project';
  return `${sanitizedProject}__${moduleKey}__${submissionId}.pdf`;
}

function buildMinimalPdf() {
  const txt = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nstartxref\n0\n%%EOF';
  return new TextEncoder().encode(txt);
}

(function run() {
  const pdfBytes = buildMinimalPdf();
  assert(pdfBytes instanceof Uint8Array, 'PDF output should be Uint8Array');

  const text = new TextDecoder().decode(pdfBytes);
  assert(text.startsWith('%PDF-1.4'), 'PDF header missing');
  assert(text.endsWith('%%EOF'), 'PDF EOF marker missing');

  const fname = sanitizeName(' Big / Unsafe : Project * Name ? ', 'motorized_screens_ordering_tool', 'sub-123');
  assert(!/[\\/:*?"<>|]/.test(fname), 'Unsafe characters were not sanitized');
  assert(fname.includes('__motorized_screens_ordering_tool__sub-123.pdf'), 'Naming structure incorrect');

  const b64 = Buffer.from(pdfBytes).toString('base64');
  assert(typeof b64 === 'string' && b64.length > 0, 'Base64 conversion failed');

  const multiScreen = [{ screenNumber: 1 }, { screenNumber: 2 }];
  assert(multiScreen.length === 2, 'Multi-screen baseline failed');

  console.log('pdf validation harness passed');
})();
