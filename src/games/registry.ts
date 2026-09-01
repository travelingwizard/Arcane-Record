import { GameSystemRegistry } from './game-system-registry';
import { exalted1eDefinition } from './exalted1e/definition';
import { mage20Definition } from './mage20/definition';
import { burningWheelDefinition } from './burning-wheel/definition';
import { torchbearer2eDefinition } from './torchbearer2e/definition';

export const gameSystemRegistry = new GameSystemRegistry()
  .register(mage20Definition)
  .register(exalted1eDefinition)
  .register(burningWheelDefinition)
  .register(torchbearer2eDefinition);
