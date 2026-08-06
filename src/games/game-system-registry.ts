import type { GameSystemDefinition, RegisteredGameSystem } from './game-system';

export class GameSystemRegistry {
  private readonly systems = new Map<string, RegisteredGameSystem>();

  register<TCharacter>(definition: GameSystemDefinition<TCharacter>) {
    if (this.systems.has(definition.id)) {
      throw new Error(`Game system "${definition.id}" is already registered.`);
    }
    this.systems.set(definition.id, definition as RegisteredGameSystem);
    return this;
  }

  get(systemId: string) {
    return this.systems.get(systemId);
  }

  list() {
    return [...this.systems.values()];
  }
}
