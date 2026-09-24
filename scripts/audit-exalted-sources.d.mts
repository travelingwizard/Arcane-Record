export type Disposition =
  | 'selectable'
  | 'calculated'
  | 'reference-only'
  | 'unresolved'
  | 'gm-only'
  | 'excluded';

export interface InventoryCitation {
  bookId: string;
  printedPage?: number | string;
  pdfPage?: number | string;
}

export interface InventoryRow {
  id: string;
  name?: string;
  disposition?: string;
  summary?: string;
  requirements?: string;
  mechanics?: string;
  cost?: string;
  compatibility?: string;
  verificationState?: 'unreviewed' | 'reviewed';
  citation?: InventoryCitation;
  crossReferences?: string[];
  notes?: string;
}

export interface PromotedCatalogEntry {
  id: string;
  [key: string]: unknown;
}

export interface AuditIssue {
  severity: 'error' | 'warning';
  message: string;
  id?: string;
}

export type FamilyAuditStatus =
  | 'pending-source-material'
  | 'pending-certification'
  | 'failing';

export interface FamilyAuditReport {
  family: string;
  status: FamilyAuditStatus;
  inventoryRows: number;
  promotedEntries: number;
  catalogChecksum: string;
  issues: AuditIssue[];
}

export const PLANNED_EXALTED_FAMILIES: readonly string[];
export const VALID_DISPOSITIONS: ReadonlySet<Disposition>;

export function computeChecksum(value: unknown): string;

export function auditInventoryRows(
  rows: readonly InventoryRow[],
  options?: { sourceManifestBookIds?: ReadonlySet<string> },
): AuditIssue[];

export function auditPromotedCatalog(
  promotedEntries: readonly PromotedCatalogEntry[],
  inventoryRows: readonly InventoryRow[],
): AuditIssue[];

export function auditFamily(
  family: string,
  options?: { repoRoot?: string },
): FamilyAuditReport;

export function auditAllFamilies(options?: {
  repoRoot?: string;
}): FamilyAuditReport[];
