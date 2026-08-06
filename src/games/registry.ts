import { GameSystemRegistry } from './game-system-registry';
import { mage20Definition } from './mage20/definition';

export const gameSystemRegistry = new GameSystemRegistry().register(
  mage20Definition,
);
