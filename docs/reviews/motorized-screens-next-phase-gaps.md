# Motorized Screens Next-Phase Gaps Review

## Scope
This follow-up review captures next-phase delivery gaps for the Motorized Screens module implementation currently in-repo.

This document does **not** modify application code. It defines what remains to be implemented and verified before production-readiness.

---

## Current Gaps

### 1) PDF generation is not fully implemented
**Current state**
- Current module code builds structured PDF-ready sections only.
- No complete PDF rendering pipeline (template engine, binary generation, storage/attachment workflow) is fully implemented in the app layer.

**Gap**
- Implement deterministic PDF generation from saved submission snapshots.
- Ensure output section order and formatting match required Screens document structure.
- Add PDF generation observability (timing, error traces, generated artifact id).

---

### 2) Measurement calculation logic must be verified against original Google AI Studio tool
**Current state**
- Measurement summary logic exists for slope and top-bottom differential.
- No verified parity evidence against the original Google AI Studio calculations is currently documented.

**Gap**
- Build a parity test matrix using known historical examples from the original tool.
- Verify each derived field (Upper Slope, Slope Direction, High/Low Side, T-B Diff) against source outputs.
- Capture approved tolerance rules and rounding behavior.

---

### 3) Add `schemaVersion` to every saved submission
**Current state**
- Submission payload currently omits explicit schema versioning.

**Gap**
- Add `schemaVersion` to all submission records.
- Define migration policy for future schema changes.
- Track schemaVersion in export payload and activity traces for auditability.

---

### 4) Add export status lifecycle
**Current state**
- Export trace persistence exists, but lifecycle states are not standardized.

**Gap**
- Add and persist explicit export statuses:
  - `queued`
  - `sent_to_make`
  - `archived`
  - `failed`
- Enforce status transitions and transition timestamps.
- Surface state in My Projects and activity log.

---

### 5) Add Make retry/error handling
**Current state**
- Make webhook call exists with basic non-OK error handling.

**Gap**
- Add idempotent retry policy (with bounded retries/backoff).
- Capture response/error payload snapshots in activity.
- Distinguish transient vs terminal failures.
- Add dead-letter visibility for failed exports requiring operator intervention.

---

### 6) Add SharePoint archive confirmation fields
**Current state**
- Export trace stores limited fields (`makeExecutionId`, `sharePointUrl`, `exportedAt`).

**Gap**
- Capture full archive confirmation fields:
  - `sharePointSiteId`
  - `sharePointDriveId`
  - `sharePointItemId`
  - `sharePointFileName`
  - `sharePointArchivedAt`
  - `sharePointVersion`
  - `sharePointChecksum` (if available)
- Store in append-only activity trace entries.

---

### 7) Add UI implementation plan

## Recommended UI Plan

### Phase UI-1: Module shell and routing
- Wire module entry route and authenticated navigation.
- Add project selection guard before form editing.

### Phase UI-2: Sectioned multi-screen form
- Implement header capture.
- Implement 7-section screen form blocks.
- Support add/remove/reorder screen items.
- Support per-screen validation feedback.

### Phase UI-3: Review + save flow
- Add structured review screen.
- Save as append-only submission snapshots.
- Show schemaVersion and submissionId.

### Phase UI-4: Export flow
- Add export action with lifecycle statuses.
- Surface Make/SharePoint trace details.
- Show failure recovery actions.

### Phase UI-5: My Projects integration UX
- Show latest + historical submissions.
- Show export status timeline and timestamps.

---

### 8) Add test plan

## Recommended Test Plan

### A. Domain unit tests
- Raw measurement validation edge cases.
- Derived measurement outputs for known fixtures.
- Manufacturer/motor normalization behavior.

### B. Submission persistence tests
- Append-only path correctness.
- Submission includes required metadata (`schemaVersion`, moduleKey, submissionId).
- Activity write integrity.

### C. Export lifecycle tests
- Status transition sequence correctness.
- Make webhook success/failure branches.
- Retry and backoff behavior.
- Idempotency under duplicate export requests.

### D. SharePoint trace tests
- Required archive confirmation fields persisted.
- Archived status set only after confirmation.

### E. End-to-end workflow tests
- Login -> open module -> save -> My Projects visibility -> export -> archive trace.
- Failure-path UX and recovery behavior.

---

## Recommended Next Implementation Sequence

1. **Versioning Foundation**
   - Add `schemaVersion` to submission and activity payload contracts.

2. **Export Lifecycle Contract**
   - Add explicit export status model and transition guards.

3. **Make Reliability Layer**
   - Implement retry/backoff/idempotency-aware error handling.

4. **SharePoint Confirmation Contract**
   - Persist full archive metadata fields and set `archived` only on confirmation.

5. **PDF Generation Engine**
   - Implement deterministic PDF renderer from saved snapshots (not transient form state).

6. **Measurement Parity Verification**
   - Validate calculations against original Google AI Studio reference outputs and document parity sign-off.

7. **UI Delivery**
   - Deliver sectioned multi-screen form, review, and export lifecycle surfaces.

8. **Comprehensive Testing**
   - Add unit/integration/E2E tests and acceptance fixtures for parity and workflow governance.

---

## Exit Criteria for Next Phase
- PDF generation implemented end-to-end.
- Measurement parity signed off against original tool outputs.
- `schemaVersion` present on all submissions.
- Export lifecycle states persisted and surfaced.
- Make retry/error handling operational.
- SharePoint archive confirmation fields persisted.
- UI flow available for header + all seven sections + export visibility.
- Test plan implemented with passing baseline coverage.
