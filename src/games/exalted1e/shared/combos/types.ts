export type ComboActionContext =
  'attack' | 'defense' | 'movement' | 'social' | 'misc';

export interface CharmComboRules {
  eligible: boolean;
  restrictions: string[];
  actionContexts?: ComboActionContext[];
  specialRules: string[];
  crossAbilityAllowed?: boolean;
  repeatsOtherCharmCosts?: boolean;
}

export interface ExaltedCombo {
  id: string;
  name: string;
  charmIds: string[];
  description: string;
  tacticalSummary: string;
  notes: string;
  createdAt: string;
}

export interface ComboValidationIssue {
  code: string;
  message: string;
}

export interface ComboCostSummary {
  activationWillpower: number;
  fixedMotes: number;
  variableMotes: string[];
  healthCosts: string[];
  otherCosts: string[];
  exaltTypeSurcharge: number;
  notes: string[];
}

export interface ComboAnalysis {
  valid: boolean;
  errors: ComboValidationIssue[];
  warnings: ComboValidationIssue[];
  charmTypes: string[];
  activationCost: ComboCostSummary;
  applicableActions: ComboActionContext[];
  dynamicCosts: boolean;
}
