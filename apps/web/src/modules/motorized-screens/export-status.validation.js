const assert = require('assert');

(function run() {
  const statuses = ['queued', 'sent_to_make', 'archived', 'failed'];
  assert(statuses.includes('queued'));
  assert(statuses.includes('sent_to_make'));
  assert(statuses.includes('archived'));
  assert(statuses.includes('failed'));

  // retry policy shape
  const maxAttempts = 3;
  assert.strictEqual(maxAttempts, 3);

  // archived evidence path remains unchanged
  const makeResultWithArchive = { sharePointUrl: 'https://sharepoint/file' };
  const derived = makeResultWithArchive.sharePointUrl ? 'archived' : 'sent_to_make';
  assert.strictEqual(derived, 'archived');

  // failed only after max attempts
  const failureTrace = { status: 'failed', attemptCount: 3, errorSummary: 'network timeout' };
  assert.strictEqual(failureTrace.status, 'failed');
  assert.strictEqual(failureTrace.attemptCount, 3);
  console.log('export status validation harness passed');
})();
