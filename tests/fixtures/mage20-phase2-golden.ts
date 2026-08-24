import { createBlankMageCharacter } from '../../src/systems/mage-m20/create-character';

export function createMage20Phase2GoldenCharacter() {
  const character = createBlankMageCharacter(
    new Date('2026-08-24T12:00:00.000Z'),
    '49b87c70-b21c-4a9a-8632-13a9ca09c87d',
  );
  character.identity.name = 'Morgan Vale';
  character.identity.player = 'Alex';
  character.identity.affiliation = 'Order of Hermes';
  character.identity.concept = 'Occult cartographer';
  character.attributes.physical = {
    strength: 2,
    dexterity: 4,
    stamina: 3,
  };
  character.attributes.social = {
    charisma: 3,
    manipulation: 2,
    appearance: 2,
  };
  character.attributes.mental = {
    perception: 4,
    intelligence: 4,
    wits: 3,
  };
  character.abilities.talents.alertness = 3;
  character.abilities.talents.awareness = 2;
  character.abilities.skills.martialArts = 2;
  character.abilities.skills.do = 1;
  character.abilities.knowledges.occult = 4;
  character.abilities.knowledges.cosmology = 3;
  return character;
}

export const mage20Phase2GoldenSummaries = Object.freeze({
  identity: 'Morgan Vale · Order of Hermes',
  attributes: 'Physical 9 · Social 7 · Mental 11',
  abilities: 'Talents 2 · Skills 2 · Knowledges 2',
});
