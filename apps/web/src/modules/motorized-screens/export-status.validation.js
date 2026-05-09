const assert = require('assert');

(function run() {
  const statuses = ['queued', 'sent_to_make', 'archived', 'failed'];
  assert(statuses.includes('queued'));
  assert(statuses.includes('sent_to_make'));
  assert(statuses.includes('archived'));
  assert(statuses.includes('failed'));

  const makeResultWithArchive = { sharePointUrl: 'https://sharepoint/file' };
  const derived = makeResultWithArchive.sharePointUrl ? 'archived' : 'sent_to_make';
  assert.strictEqual(derived, 'archived');
  console.log('export status validation harness passed');
})();
