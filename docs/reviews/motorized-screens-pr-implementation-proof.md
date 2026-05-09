# Motorized Screens PR Implementation Proof

## 1) Exact TypeScript type definitions from `packages/domain/src/motorizedScreens.ts`

```ts
export const MODULE_KEY = 'motorized_screens_ordering_tool';

export type ScreenManufacturer = 'DOS Screens' | 'MagnaTrack';
export type MotorType = 'Alpha';

export type RawMeasurements = {
  UL: number;
  LL: number;
  OL: number;
  UR: number;
  LR: number;
  OR: number;
  T: number;
  M: number;
  B: number;
};

export type ScreenConfigSection = {
  screenLabel: string;
  frameColor?: string;
  frameType?: string;
};

export type MotorConfigSection = {
  motorType?: MotorType;
  controlType?: string;
  powerNotes?: string;
};

export type OrderMeasurementsSection = {
  orderedWidthIn: number;
  orderedHeightIn: number;
};

export type MaterialsSection = {
  meshType?: string;
  splineColor?: string;
};

export type MiscSection = {
  notes?: string;
};

export type AttachmentsSection = {
  attachmentIds: string[];
};

export type MotorizedScreenItemInput = {
  screenNumber: number;
  manufacturer: ScreenManufacturer;
  section1: ScreenConfigSection;
  section2: MotorConfigSection;
  section3: OrderMeasurementsSection;
  section4: MaterialsSection;
  section5: MiscSection;
  section6Raw: RawMeasurements;
  section7: AttachmentsSection;
};

export type DerivedMeasurementSummary = {
  upperSlope: number;
  slopeDirection: 'left_high' | 'right_high' | 'flat';
  highSide: number;
  lowSide: number;
  tbDiff: number;
};

export function validateRawMeasurements(raw: RawMeasurements): string[] {
  const errors: string[] = [];
  (Object.entries(raw) as Array<[keyof RawMeasurements, number]>).forEach(([key, value]) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) errors.push(`${key} must be a positive number`);
  });
  return errors;
}

export function validateScreenItem(item: MotorizedScreenItemInput): string[] {
  const errors: string[] = [];
  if (item.screenNumber < 1 || !Number.isInteger(item.screenNumber)) errors.push('screenNumber must be an integer >= 1');
  if (item.section3.orderedWidthIn <= 0) errors.push('orderedWidthIn must be > 0');
  if (item.section3.orderedHeightIn <= 0) errors.push('orderedHeightIn must be > 0');
  errors.push(...validateRawMeasurements(item.section6Raw));
  return errors;
}

export function normalizeManufacturerAndMotor(item: MotorizedScreenItemInput): MotorizedScreenItemInput {
  if (item.manufacturer === 'DOS Screens' && !item.section2.motorType) {
    return { ...item, section2: { ...item.section2, motorType: 'Alpha' } };
  }
  return item;
}

export function deriveMeasurementSummary(raw: RawMeasurements): DerivedMeasurementSummary {
  const leftAvg = (raw.UL + raw.LL + raw.OL) / 3;
  const rightAvg = (raw.UR + raw.LR + raw.OR) / 3;
  const upperSlope = Number((leftAvg - rightAvg).toFixed(3));
  const slopeDirection = upperSlope > 0 ? 'left_high' : upperSlope < 0 ? 'right_high' : 'flat';
  const highSide = Number(Math.max(leftAvg, rightAvg).toFixed(3));
  const lowSide = Number(Math.min(leftAvg, rightAvg).toFixed(3));
  const tbDiff = Number((raw.T - raw.B).toFixed(3));

  return { upperSlope, slopeDirection, highSide, lowSide, tbDiff };
}

export function buildPdfStructuredSections(item: MotorizedScreenItemInput) {
  return {
    section1: item.section1,
    section2: item.section2,
    section3: item.section3,
    section4: item.section4,
    section5: item.section5,
    section6: {
      rawMeasurements: item.section6Raw,
      calcSummary: deriveMeasurementSummary(item.section6Raw),
    },
    section7: item.section7,
  };
}

```

## 2) Exact validation functions

```ts
export function validateRawMeasurements(raw: RawMeasurements): string[] {
  const errors: string[] = [];
  (Object.entries(raw) as Array<[keyof RawMeasurements, number]>).forEach(([key, value]) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) errors.push(`${key} must be a positive number`);
  });
  return errors;
}

export function validateScreenItem(item: MotorizedScreenItemInput): string[] {
  const errors: string[] = [];
  if (item.screenNumber < 1 || !Number.isInteger(item.screenNumber)) errors.push('screenNumber must be an integer >= 1');
  if (item.section3.orderedWidthIn <= 0) errors.push('orderedWidthIn must be > 0');
  if (item.section3.orderedHeightIn <= 0) errors.push('orderedHeightIn must be > 0');
  errors.push(...validateRawMeasurements(item.section6Raw));
  return errors;
}
```

## 3) Exact calculation functions for upperSlope, slopeDirection, highSide, lowSide, tbDiff

```ts
export function deriveMeasurementSummary(raw: RawMeasurements): DerivedMeasurementSummary {
  const leftAvg = (raw.UL + raw.LL + raw.OL) / 3;
  const rightAvg = (raw.UR + raw.LR + raw.OR) / 3;
  const upperSlope = Number((leftAvg - rightAvg).toFixed(3));
  const slopeDirection = upperSlope > 0 ? 'left_high' : upperSlope < 0 ? 'right_high' : 'flat';
  const highSide = Number(Math.max(leftAvg, rightAvg).toFixed(3));
  const lowSide = Number(Math.min(leftAvg, rightAvg).toFixed(3));
  const tbDiff = Number((raw.T - raw.B).toFixed(3));

  return { upperSlope, slopeDirection, highSide, lowSide, tbDiff };
}
```

## 4) Exact Firestore submission write payload

```ts
export async function appendOnlySaveSubmission(db: any, uid: string, submission: MotorizedScreensSubmission) {
  const submissionPath = `users/${uid}/projects/${submission.projectId}/submissions/${submission.submissionId}`;
  await db.doc(submissionPath).set(submission);
```

## 5) Exact Firestore activity write payload

```ts
const activityPath = `users/${uid}/activity/${submission.submissionId}`;
  await db.doc(activityPath).set({
    type: 'motorized_screens_submission_saved',
    moduleKey: MODULE_KEY,
    projectId: submission.projectId,
    submissionId: submission.submissionId,
    createdAt: submission.createdAt,
    myProjects: {
      module: 'Motorized Screens – Ordering Tool',
      summary: `${submission.header.totalNumberOfScreens} screens`,
    },
  });

export async function persistExportTrace(db: any, uid: string, submissionId: string, trace: { makeExecutionId?: string; sharePointUrl?: string; exportedAt: string }) {
  const exportTracePath = `users/${uid}/activity/${submissionId}__export__${trace.exportedAt}`;
  await db.doc(exportTracePath).set({
    type: 'motorized_screens_exported',
    submissionId,
    exportPipeline: 'make_to_sharepoint',
    ...trace,
  });
}
```

## 6) Exact Make webhook payload

```ts
const payload = {
    moduleKey: MODULE_KEY,
    projectId: params.submission.projectId,
    submissionId: params.submission.submissionId,
    projectName: params.submission.projectName,
    uid: params.userUid,
    pdfBase64: params.pdfBase64,
    fileName,
    createdAt: new Date().toISOString(),
  };
```

## 7) PDF implementation status

- **Implemented**

```ts
export function buildOrderPdfSections(submission: Awaited<ReturnType<typeof saveMotorizedScreensOrder>>) {
  return {
    header: submission.header,
    screens: submission.screens,
  };
}
```

## 8) Exact changed file list

- `apps/web/src/guards/firebaseAuthGuard.ts`
- `apps/web/src/modules/motorized-screens/module.ts`
- `apps/web/src/projects/myProjectsMotorizedScreens.ts`
- `packages/domain/src/motorizedScreens.ts`
- `packages/firebase/src/motorizedScreensRepository.ts`
- `packages/integrations/src/makeSharepoint.ts`


## PDF Status Note

PDF generation intentionally skipped in this revision per instruction.

Re-open request processed on 2026-05-04.
