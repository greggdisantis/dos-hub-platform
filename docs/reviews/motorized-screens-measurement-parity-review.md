# Motorized Screens Measurement Parity Review

## Scope
Phase 2 parity audit for Motorized Screens measurement logic.

This document compares:
- current implementation in `packages/domain/src/motorizedScreens.ts`
- available Google AI Studio reference artifacts in `reference/google-ai-studio/motorized-screens/`

No production logic was changed as part of this review.

---

## 1) Current Implementation Summary

### Raw measurement input fields currently implemented
- `UL`
- `LL`
- `OL`
- `UR`
- `LR`
- `OR`
- `T`
- `M`
- `B`

### Derived fields currently implemented
- `upperSlope`
- `slopeDirection`
- `highSide`
- `lowSide`
- `tbDiff`

### Current formulas implemented
1. `leftAvg = (UL + LL + OL) / 3`
2. `rightAvg = (UR + LR + OR) / 3`
3. `upperSlope = round3(leftAvg - rightAvg)`
4. `slopeDirection = left_high if upperSlope > 0; right_high if < 0; flat otherwise`
5. `highSide = round3(max(leftAvg, rightAvg))`
6. `lowSide = round3(min(leftAvg, rightAvg))`
7. `tbDiff = round3(T - B)`

### Validation behavior
- Every raw measurement value must be numeric and `> 0`.

---

## 2) Google AI Studio Reference Behavior Summary

### Reference assets available in repo
- `reference/google-ai-studio/motorized-screens/README.md` only.

### Result
No executable source, formulas, fixtures, screenshots, PDFs, or zipped artifacts are currently available in the repository for Google AI Studio logic extraction.

### Consequence
Exact parity verification cannot be fully completed from repository evidence alone in the current checkout.

---

## 3) Field-by-Field Comparison

| Field / Behavior | Current DOS Hub Implementation | Google AI Studio Reference in Repo | Assessment |
|---|---|---|---|
| UL | present | not available | incomplete evidence |
| LL | present | not available | incomplete evidence |
| OL | present | not available | incomplete evidence |
| UR | present | not available | incomplete evidence |
| LR | present | not available | incomplete evidence |
| OR | present | not available | incomplete evidence |
| T | present | not available | incomplete evidence |
| M | present | not available | incomplete evidence |
| B | present | not available | incomplete evidence |
| TM field naming | **not present** (`T` + `M` are separate) | unknown from repo assets | potential naming mismatch |
| upperSlope | implemented | not available | oversimplified risk |
| slopeDirection | implemented | not available | acceptable interim |
| highSide / lowSide | implemented | not available | oversimplified risk |
| tbDiff | implemented as `T - B` | not available | oversimplified risk |

---

## 4) Identified Gaps

1. **Primary gap: missing reference formulas**
   - No extractable Google AI Studio calculation logic exists in checked-in reference path.

2. **Potential field naming mismatch (`TM`)**
   - Current implementation uses `T` and `M` separately.
   - Requested preserve list mentions `TM` and `B` in latest instruction language.
   - This may be naming drift or typo; requires source confirmation.

3. **Potential oversimplification risk in derived calculations**
   - Current formulas are deterministic and simple, but parity with legacy behavior is unproven.

4. **No parity fixture dataset**
   - There are no known input/output benchmark fixtures from Google AI Studio implementation.

---

## 5) Risk Level

**Overall risk: Medium-High** for parity certification (not for runtime stability).

- Runtime logic is coherent and deterministic.
- Parity confidence is low because source-of-truth formulas are absent from repository reference assets.

---

## 6) Recommendation: Are formula changes needed now?

**Recommendation: Do not change formulas yet.**

Reason:
- No authoritative Google AI Studio formula source is currently available in repo for proof-based comparison.
- Changing formulas now would introduce unverified drift.

Exception policy:
- Only apply formula changes once a verified source artifact or signed fixture set is added and mapped.

---

## 7) Proposed Next Implementation Steps (if/when changes are required)

1. **Collect reference evidence**
   - Add real Google AI Studio artifacts (source export, sample sheets, screenshots, or known IO fixtures) to `reference/google-ai-studio/motorized-screens/`.

2. **Build parity fixture matrix**
   - Create fixture file with canonical raw inputs and expected outputs for:
     - `upperSlope`
     - `slopeDirection`
     - `highSide`
     - `lowSide`
     - `tbDiff`

3. **Validate naming contract (`TM` vs `T` + `M`)**
   - Confirm whether legacy model expects combined `TM` or separate `T` and `M`.

4. **Run deterministic parity comparison**
   - Compare current outputs to reference fixture outputs.

5. **Only then patch formulas (if needed)**
   - If mismatches are confirmed, implement narrowly scoped formula fixes.
   - Keep Firestore paths, auth behavior, module key, and non-measurement logic unchanged.

6. **Record evidence**
   - Update implementation proof and this review with line-by-line mismatch resolution.

---

## Conclusion
Current measurement logic is **internally consistent** but **not parity-certified** against Google AI Studio due to missing source artifacts in the repository.

Status:
- correctness: **unproven**
- completeness: **incomplete evidence**
- risk of hidden drift: **moderate to high**

Action now:
- keep formulas unchanged
- complete evidence-driven parity validation before any formula updates
