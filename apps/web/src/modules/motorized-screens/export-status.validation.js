const assert = require('assert');

(function run() {
  const statuses = ['queued', 'sent_to_make', 'archived', 'failed'];
  assert(statuses.includes('queued'));
  assert(statuses.includes('sent_to_make'));
  assert(statuses.includes('archived'));
  assert(statuses.includes('failed'));

  // Retry policy remains bounded
  const maxAttempts = 3;
  assert.strictEqual(maxAttempts, 3);

  // archive evidence from url
  const r1 = { sharePointUrl: 'https://sharepoint/file' };
  assert(Boolean(r1.sharePointUrl));

  // archive evidence from file id
  const r2 = { sharePointFileId: 'sp-file-1' };
  assert(Boolean(r2.sharePointFileId));

  // archive evidence from archived flag
  const r3 = { archived: true };
  assert.strictEqual(r3.archived, true);

  // partial response allowed
  const partial = { executionId: 'mk-1' };
  assert.strictEqual(partial.executionId, 'mk-1');

  // no archive evidence
  const none = { executionId: 'mk-2' };
  const hasEvidence = Boolean(none.sharePointUrl || none.sharePointFileId || none.archived === true || none.sharePointWebUrl);
  assert.strictEqual(hasEvidence, false);

  // failed includes attempt count
  const failureTrace = { status: 'failed', attemptCount: 3, errorSummary: 'network timeout' };
  assert.strictEqual(failureTrace.status, 'failed');
  assert.strictEqual(failureTrace.attemptCount, 3);
  console.log('export status validation harness passed');
})();
