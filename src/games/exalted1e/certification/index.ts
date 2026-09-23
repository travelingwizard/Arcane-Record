import lunarData from './lunar.json';
import abyssalData from './abyssal.json';
import siderealData from './sidereal.json';
import alchemicalData from './alchemical.json';
import fairFolkData from './fair-folk.json';
import {
  plannedExaltedFamilies,
  type PlannedExaltedFamily,
} from '../definitions';
import {
  splatCertificationRecordSchema,
  type SplatCertificationRecord,
} from './schema';

const rawRecords: Record<PlannedExaltedFamily, unknown> = {
  lunar: lunarData,
  abyssal: abyssalData,
  sidereal: siderealData,
  alchemical: alchemicalData,
  'fair-folk': fairFolkData,
};

/**
 * Checked-in certification evidence for every planned Exalted 1e family,
 * validated against `splatCertificationRecordSchema`. A malformed record
 * fails at import time rather than silently unlocking a family.
 */
export const certificationRecords: Record<
  PlannedExaltedFamily,
  SplatCertificationRecord
> = Object.fromEntries(
  plannedExaltedFamilies.map((family) => [
    family,
    splatCertificationRecordSchema.parse(rawRecords[family]),
  ]),
) as Record<PlannedExaltedFamily, SplatCertificationRecord>;

export { splatCertificationRecordSchema } from './schema';
export type {
  SplatCertificationRecord,
  SplatCatalogEvidence,
  CertificationTestStatus,
} from './schema';
