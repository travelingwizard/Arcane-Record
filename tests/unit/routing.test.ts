import { describe, expect, it } from 'vitest';
import { parseRoute } from '../../src/app/routing';

describe('application routes', () => {
  it('parses shared routes without game-specific path checks', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' });
    expect(parseRoute('/create')).toEqual({ name: 'create' });
    expect(parseRoute('/create/mage20')).toEqual({
      name: 'create',
      systemId: 'mage20',
    });
    expect(parseRoute('/create/exalted1e/dragon-blooded')).toEqual({
      name: 'not-found',
    });
    expect(parseRoute('/characters/abc')).toEqual({
      name: 'character',
      id: 'abc',
    });
    expect(parseRoute('/settings')).toEqual({ name: 'settings' });
    expect(parseRoute('/module-builder')).toEqual({
      name: 'module-builder',
    });
    expect(parseRoute('/module-builder/draft-id')).toEqual({
      name: 'module-builder',
      draftId: 'draft-id',
    });
    expect(parseRoute('/modules')).toEqual({ name: 'module-library' });
    expect(parseRoute('/create-module/local.example/game/sheet')).toEqual({
      name: 'create-module',
      moduleId: 'local.example',
      gameNodeId: 'game',
      templateId: 'sheet',
    });
    expect(parseRoute('/mage')).toEqual({ name: 'not-found' });
  });
});
