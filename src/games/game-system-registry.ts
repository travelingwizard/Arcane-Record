import type {
  GameSystemDefinition,
  GameSystemFamilyDefinition,
  RegisteredGameSystem,
} from './game-system';

export class GameSystemRegistry {
  private readonly systems = new Map<string, RegisteredGameSystem>();
  private readonly families = new Map<string, GameSystemFamilyDefinition>();

  registerFamily(definition: GameSystemFamilyDefinition) {
    if (this.families.has(definition.id) || this.systems.has(definition.id)) {
      throw new Error(`Game family "${definition.id}" is already registered.`);
    }
    this.families.set(definition.id, definition);
    return this;
  }

  register<TCharacter>(definition: GameSystemDefinition<TCharacter>) {
    if (this.systems.has(definition.id) || this.families.has(definition.id)) {
      throw new Error(`Game system "${definition.id}" is already registered.`);
    }
    this.systems.set(definition.id, definition as RegisteredGameSystem);
    return this;
  }

  get(systemId: string) {
    return this.systems.get(systemId);
  }

  getFamily(familyId: string) {
    return this.families.get(familyId);
  }

  listFamilies() {
    return [...this.families.values()];
  }

  list() {
    return [...this.systems.values()];
  }
}
