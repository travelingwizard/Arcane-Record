export interface EarthdawnSpellVariant {
  discipline: string;
  circleMin: number;
  circleMax: number;
  circleText: string;
  sourceId: string;
  pageStart: number | null;
  pageEnd: number | null;
}

export interface EarthdawnSpellReference {
  name: string;
  description: string;
  effectText: string;
  threadsText: string;
  threadsValue: number | null;
  difficultyText: string;
  weavingDifficulty?: number;
  reattuningDifficulty?: number;
  castingDifficulty?: number;
  aliases: readonly string[];
  legacyPlayerGuideId: boolean;
  variants: readonly EarthdawnSpellVariant[];
}
