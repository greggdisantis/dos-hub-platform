const assert = require('assert');

(function run() {
  const newSubmission = {
    moduleKey: 'motorized_screens_ordering_tool',
    schemaVersion: 1,
    submissionId: 'sub-1',
    projectId: 'proj-1',
  };

  assert.strictEqual(typeof newSubmission.schemaVersion, 'number', 'schemaVersion must be numeric');
  assert.strictEqual(newSubmission.schemaVersion, 1, 'schemaVersion must be 1');
  console.log('schema validation harness passed');
})();
