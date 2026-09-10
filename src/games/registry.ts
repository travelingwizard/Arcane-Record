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
import { dav20Definition } from './vampire-dark-ages20/definition';
import { v20Definition } from './vampire20/definition';
import { w20Definition } from './werewolf20/definition';
import { wr20Definition, wr20ShadowDefinition } from './wraith20/definition';
import {
  mouseGuardDefinition,
  mouseGuardPatrolDefinition,
} from './mouse-guard2e/definition';
import {
  bobChosenDefinition,
  bobDefinition,
  bobLegionDefinition,
} from './band-of-blades/definition';
import {
  bitdDefinition,
  bitdCrewDefinition,
} from './blades-in-the-dark/definition';
import {
  mmDefinition,
  mmCampaignDefinition,
} from './miseries-and-misfortunes/definition';
import {
  motwDefinition,
  motwKeeperDefinition,
} from './monster-of-the-week/definition';
import {
  coc2eDefinition,
  coc2eKeeperDefinition,
} from './call-of-cthulhu2e/definition';
import { coc7eDefinition } from './call-of-cthulhu7e/definition';

export const gameSystemRegistry = new GameSystemRegistry()
  .registerFamily({
    id: 'call-of-cthulhu',
    name: 'Call of Cthulhu',
    shortName: 'Call of Cthulhu',
    description:
      'Choose a supported edition, then an Investigator or Keeper record.',
  })
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
  .register(changeling20Definition)
  .register(dav20Definition)
  .register(v20Definition)
  .register(w20Definition)
  .register(wr20Definition)
  .register(wr20ShadowDefinition)
  .register(mouseGuardDefinition)
  .register(mouseGuardPatrolDefinition)
  .register(bobDefinition)
  .register(bobLegionDefinition)
  .register(bobChosenDefinition)
  .register(bitdDefinition)
  .register(bitdCrewDefinition)
  .register(mmDefinition)
  .register(mmCampaignDefinition)
  .register(motwDefinition)
  .register(motwKeeperDefinition)
  .register(coc2eDefinition)
  .register(coc2eKeeperDefinition)
  .register(coc7eDefinition);
