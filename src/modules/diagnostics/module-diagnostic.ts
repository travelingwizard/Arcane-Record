export type ModuleDiagnosticSeverity = 'information' | 'warning' | 'error';

export interface ModuleDiagnostic {
  code: string;
  severity: ModuleDiagnosticSeverity;
  path: string;
  message: string;
  relatedIds?: string[];
  remediation?: string;
}

export class ModuleValidationError extends Error {
  constructor(
    message: string,
    readonly diagnostics: ModuleDiagnostic[],
  ) {
    super(message);
    this.name = 'ModuleValidationError';
  }
}
