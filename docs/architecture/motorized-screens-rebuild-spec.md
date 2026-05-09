# Motorized Screens Rebuild Specification (Forensic Asset Inspection)

## Review Metadata
- **Date:** 2026-05-04
- **Goal:** Extract actual legacy behavior from committed reference assets (zip/pdf/screenshots)
- **Instruction constraints:** documentation update only; no app code changes

## Inspection Actions Performed

1. Enumerated all files under:
   - `reference/google-ai-studio/motorized-screens/`
   - `reference/manus/`
2. Looked for zip archives in:
   - `reference/google-ai-studio/motorized-screens/*.zip`
   - `reference/manus/*.zip`
3. Looked for PDFs in:
   - `reference/google-ai-studio/motorized-screens/*.pdf`
4. Looked for screenshot image files in:
   - `reference/google-ai-studio/motorized-screens/*.{png,jpg,jpeg,webp}`

## Evidence Found
Only these files are present:
- `reference/google-ai-studio/motorized-screens/README.md`
- `reference/manus/README.md`

No zip, PDF, or screenshot assets exist in this repository checkout; therefore unzip/PDF/image-content inspection is not possible here.

---

## Extracted Specification (Grounded to Available Evidence)

### 1) Actual Workflow
#### 1.1 Directly extractable from inspected assets
- No legacy executable workflow is present in available reference files.

#### 1.2 Authoritative workflow contract available in-repo (must implement)
1. User logs in via Firebase Auth.
2. User opens **Motorized Screens – Ordering Tool**.
3. User enters order details.
4. System validates required input.
5. Save creates a new submission under selected project (append-only).
6. Submission appears in **My Projects**.
7. PDF generated from saved submission snapshot.
8. Export sent through Make webhook.
9. File archived in SharePoint.
10. Export trace stored in Firestore activity.

### 2) Actual UI Flow
#### 2.1 Directly extractable
- No UI screenshots or UI files exist to extract original sequence.

#### 2.2 Governed rebuild UI flow baseline
- Project context selection
- Motorized Screens form entry
- Inline validation feedback
- Save action (new submission version)
- Summary/review screen
- PDF generation action
- Export action + status feedback
- My Projects history visibility

### 3) Actual Input Fields
#### 3.1 Directly extractable
- No field-level artifacts are present.

#### 3.2 Minimum field groups for governed rebuild
- Submission metadata (`moduleKey`, `projectId`, `submissionId`, actor/timestamps, state)
- Customer identity/contact
- Site/location details
- Repeatable screen/opening line items (dimensions/options/qty)
- Pricing modifiers or table references
- Export and archive trace metadata

### 4) Actual Validation Rules
#### 4.1 Directly extractable
- No explicit validation rules are present in inspected assets.

#### 4.2 Required baseline under governance
- Project required before save
- At least one line item required
- Dimensions/quantity must be valid positive numerics
- Export requires a successful saved snapshot
- Idempotency key on save and export
- No overwrite/delete behavior for submission history

### 5) Actual Measurement Logic
#### 5.1 Directly extractable
- No measurement formulas/tolerance rules are present.

#### 5.2 Required rebuild baseline
- Canonical unit normalization
- Deterministic rounding/allowance application
- Persist raw + normalized values for traceability
- Constraint checks before save/export

### 6) Actual Pricing / Order Logic
#### 6.1 Directly extractable
- No pricing matrices or order formulas are present.

#### 6.2 Required rebuild baseline
- Per-line deterministic totals
- Deterministic order summary totals
- Persist pricing/calculation version used

### 7) Actual Output / PDF Behavior
#### 7.1 Directly extractable
- No PDF sample/template or export payload example is present.

#### 7.2 Required behavior under governance
- File name must be `{projectName}__{moduleKey}__{submissionId}.pdf`
- Generate from immutable saved submission
- Route export through Make
- Archive in SharePoint
- Persist export trace in Firestore

### 8) What Must Be Preserved Exactly
1. Locked module identity and naming
2. Firebase Auth for authentication
3. Firestore as project-record source of truth
4. Append-only storage contract:
   - `users/{uid}/projects/{projectId}/submissions/{submissionId}`
   - `users/{uid}/activity/{submissionId}`
   - `users/{uid}/idempotency/{idempotencyKey}`
5. Unique export naming and no-overwrite semantics
6. Make as workflow/export layer
7. SharePoint as final archive
8. My Projects visibility for every saved module output

### 9) What Must Be Rebuilt Under DOS Hub Governance
- Canonical UI and input schema
- Validation and compatibility matrix
- Measurement engine
- Pricing/order summary engine
- PDF rendering template
- Make webhook request/response contract
- SharePoint archive mapping + metadata reconciliation
- My Projects submission timeline + export status model

---

## Blocking Asset Gaps
To complete the requested true legacy extraction, repository must contain:
- zip archives in both reference paths
- Google AI Studio PDF assets
- screenshot images for actual UI flow
- any source files containing field dictionaries, formulas, and validation rules

These assets were not present in the checked-out repository state used for this update.
