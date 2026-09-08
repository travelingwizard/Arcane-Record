import { GameSystemRegistry } from './game-system-registry';
import { exalted1eDefinition } from './exalted1e/definition';
import { mage20Definition } from './mage20/definition';
import { burningWheelDefinition } from './burning-wheel/definition';
import { torchbearer2eDefinition } from './torchbearer2e/definition';
import { earthdawn4eDefinition } from './earthdawn4e/definition';
import { cityDefinition, cityCrewDefinition } from './city-of-mist/definition';
import { curseDefinition } from './curseborne/definition';
import {
  legendDefinition,
  legendFellowshipDefinition,
} from './legend-in-the-mist/definition';
import { shadowrun1eDefinition } from './shadowrun1e/definition';
import { changeling20Definition } from './changeling20/definition';

export const gameSystemRegistry = new GameSystemRegistry()
  .register(mage20Definition)
  .register(exalted1eDefinition)
  .register(burningWheelDefinition)
  .register(torchbearer2eDefinition)
  .register(earthdawn4eDefinition)
  .register(cityDefinition)
  .register(cityCrewDefinition)
  .register(curseDefinition)
  .register(legendDefinition)
  .register(legendFellowshipDefinition)
  .register(shadowrun1eDefinition)
  .register(changeling20Definition);
