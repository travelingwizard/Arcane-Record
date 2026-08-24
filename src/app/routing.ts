export type AppRoute =
  | { name: 'home' }
  | { name: 'create'; systemId?: string }
  | {
      name: 'create-module';
      moduleId: string;
      gameNodeId: string;
      templateId: string;
    }
  | { name: 'character'; id: string }
  | { name: 'settings' }
  | { name: 'module-builder'; draftId?: string }
  | { name: 'module-library' }
  | { name: 'not-found' };

export function parseRoute(pathname: string): AppRoute {
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'create' && parts.length <= 2) {
    return { name: 'create', systemId: parts[1] };
  }
  if (parts[0] === 'create-module' && parts.length === 4) {
    return {
      name: 'create-module',
      moduleId: parts[1]!,
      gameNodeId: parts[2]!,
      templateId: parts[3]!,
    };
  }
  if (parts[0] === 'characters' && parts.length === 2) {
    return { name: 'character', id: parts[1] };
  }
  if (parts[0] === 'settings' && parts.length === 1) {
    return { name: 'settings' };
  }
  if (parts[0] === 'module-builder' && parts.length <= 2) {
    return { name: 'module-builder', draftId: parts[1] };
  }
  if (parts[0] === 'modules' && parts.length === 1)
    return { name: 'module-library' };
  return { name: 'not-found' };
}

export function navigate(path: string, replace = false) {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
