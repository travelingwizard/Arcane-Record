import { createArsCharacter } from './create-character';
import type { ArsCharacter } from './schema';

export const mechanicalTemplates = [
  {
    id: 'ars.template.magus-generalist',
    label: 'Magus generalist',
    role: 'magus',
    houseId: 'ars.house.bonisagus',
    characteristics: { intelligence: 2, stamina: 1, communication: 1 },
  },
  {
    id: 'ars.template.companion-envoy',
    label: 'Companion envoy',
    role: 'companion',
    houseId: null,
    characteristics: { presence: 2, communication: 2 },
  },
  {
    id: 'ars.template.grog-guard',
    label: 'Grog guard',
    role: 'grog',
    houseId: null,
    characteristics: { strength: 2, stamina: 2 },
  },
] as const;

export function createFromMechanicalTemplate(
  templateId: (typeof mechanicalTemplates)[number]['id'],
): ArsCharacter {
  const template = mechanicalTemplates.find((item) => item.id === templateId);
  if (!template) throw new Error('Unknown Ars Magica template.');
  const character = createArsCharacter(template.role, 'draft');
  for (const [key, rating] of Object.entries(template.characteristics))
    character.definition.characteristics[
      key as keyof ArsCharacter['definition']['characteristics']
    ] = rating;
  character.definition.houseId = template.houseId;
  character.creation.templateId = template.id;
  return character;
}
