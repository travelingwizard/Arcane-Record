export interface EarthdawnKnackVariant {
  key: string;
  association: string;
  description: string;
  mechanicsText: string;
  minimumRank: number | null;
  actionText: string;
  strainText: string;
  strainValue: number | null;
  sourceId: string;
  page: number | null;
}

export interface EarthdawnKnackReference {
  name: string;
  legacyCompanionId: boolean;
  variants: readonly EarthdawnKnackVariant[];
}
