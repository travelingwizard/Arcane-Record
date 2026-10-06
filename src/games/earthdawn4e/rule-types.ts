export type EarthdawnRuleBlock =
  | { type: 'paragraph' | 'note' | 'warning'; text: string }
  | { type: 'list'; items: readonly string[] }
  | {
      type: 'table';
      columns: readonly string[];
      rows: readonly (readonly string[])[];
    };

export type EarthdawnRuleMetadata = {
  set: 'basic' | 'creation';
  order: number;
  blocks: readonly EarthdawnRuleBlock[];
};
