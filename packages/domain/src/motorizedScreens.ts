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
