import { GameSystemRegistry } from './game-system-registry';
import { exalted1eDefinition } from './exalted1e/definition';
import { mage20Definition } from './mage20/definition';
import { burningWheelDefinition } from './burning-wheel/definition';

export const gameSystemRegistry = new GameSystemRegistry()
  .register(mage20Definition)
  .register(exalted1eDefinition)
  .register(burningWheelDefinition);
