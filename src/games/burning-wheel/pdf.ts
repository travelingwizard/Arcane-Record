import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import {
  burningWheelLifepathById,
  burningWheelSkillById,
  burningWheelTraitById,
  stockLabel,
} from './catalog';
import {
  burnTotals,
  derivedAttributes,
  skillRating,
  statDefinitions,
} from './engine';
import type { BurningWheelCharacter } from './schema';

function safeName(value: string) {
  return value.trim() || 'Untitled character';
}

export async function createBurningWheelPdf(character: BurningWheelCharacter) {
  const document = await PDFDocument.create();
  document.setTitle(`${safeName(character.identity.name)} — Burning Wheel`);
  document.setCreator('Arcane Record');
  const serif = await document.embedFont(StandardFonts.TimesRoman);
  const serifBold = await document.embedFont(StandardFonts.TimesRomanBold);
  const sans = await document.embedFont(StandardFonts.Helvetica);
  const totals = burnTotals(character);
  const derived = derivedAttributes(character);
  const pageSize: [number, number] = [792, 612];
  const ink = rgb(0.12, 0.1, 0.08);
  const accent = rgb(0.38, 0.08, 0.08);

  const addPage = (title: string) => {
    const page = document.addPage(pageSize);
    page.drawRectangle({
      x: 22,
      y: 22,
      width: 748,
      height: 568,
      borderColor: ink,
      borderWidth: 1,
    });
    page.drawText('ARCANE RECORD', {
      x: 40,
      y: 565,
      size: 9,
      font: sans,
      color: accent,
    });
    page.drawText(title, {
      x: 40,
      y: 536,
      size: 20,
      font: serifBold,
      color: ink,
    });
    return page;
  };
  const text = (
    page: PDFPage,
    value: string,
    x: number,
    y: number,
    size = 10,
    bold = false,
  ) =>
    page.drawText(value.replace(/[^\x20-\x7E]/g, '-'), {
      x,
      y,
      size,
      font: bold ? serifBold : serif,
      color: ink,
      maxWidth: 330,
    });

  const page = addPage('Burning Wheel Character Record');
  text(page, safeName(character.identity.name), 40, 505, 18, true);
  text(page, `${stockLabel(character.stock)} · Age ${totals.age}`, 40, 486, 11);
  text(page, `Player: ${character.identity.player || '-'}`, 410, 505, 10);
  text(page, `Concept: ${character.identity.concept || '-'}`, 410, 486, 10);
  text(page, 'Beliefs', 40, 452, 13, true);
  character.beliefs.forEach((belief, index) =>
    text(page, `${index + 1}. ${belief || '-'}`, 52, 430 - index * 22, 10),
  );
  text(page, 'Instincts', 410, 452, 13, true);
  character.instincts.forEach((instinct, index) =>
    text(page, `${index + 1}. ${instinct || '-'}`, 422, 430 - index * 22, 10),
  );
  text(page, 'Stats', 40, 348, 13, true);
  statDefinitions.forEach(({ id, label }, index) =>
    text(
      page,
      `${label}: ${character.burn.stats[id].shade}${derived.stats[id]}`,
      52 + (index % 3) * 112,
      324 - Math.floor(index / 3) * 22,
      11,
    ),
  );
  text(page, 'Attributes', 410, 348, 13, true);
  [
    ['Health', derived.health],
    ['Steel', derived.steel],
    ['Reflexes', derived.reflexes],
    ['Mortal Wound', derived.mortalWound],
    ['Hesitation', derived.hesitation],
    ['Stride', derived.stride],
  ].forEach(([label, value], index) =>
    text(
      page,
      `${label}: B${value}`,
      422 + (index % 2) * 150,
      324 - Math.floor(index / 2) * 22,
      10,
    ),
  );
  text(page, 'PTGS', 40, 250, 13, true);
  text(
    page,
    Object.entries(derived.ptgs)
      .map(([key, value]) => `${key.slice(0, 2).toUpperCase()} B${value}`)
      .join(' · '),
    52,
    228,
    10,
  );
  text(page, 'Artha', 40, 190, 13, true);
  text(
    page,
    `Fate ${character.play.artha.fate}   Persona ${character.play.artha.persona}   Deeds ${character.play.artha.deeds}`,
    52,
    168,
    11,
  );
  text(page, 'Lifepaths', 410, 250, 13, true);
  character.burn.lifepaths.slice(0, 10).forEach((selected, index) => {
    const definition = burningWheelLifepathById.get(selected.definitionId);
    text(
      page,
      `${definition?.name ?? 'Unknown'} (${selected.time} yrs)`,
      422,
      228 - index * 16,
      9,
    );
  });

  const details = addPage('Skills, Traits, Connections & Gear');
  text(details, 'Skills', 40, 505, 13, true);
  character.burn.skills.slice(0, 22).forEach((skill, index) => {
    const name =
      (skill.definitionId &&
        burningWheelSkillById.get(skill.definitionId)?.name) ||
      skill.customName;
    text(
      details,
      `${name}: ${skillRating(character, skill)}`,
      52 + (index >= 11 ? 180 : 0),
      482 - (index % 11) * 18,
      9,
    );
  });
  text(details, 'Traits', 410, 505, 13, true);
  character.burn.traits.slice(0, 18).forEach((trait, index) => {
    const name =
      (trait.definitionId &&
        burningWheelTraitById.get(trait.definitionId)?.name) ||
      trait.customName;
    text(details, name, 422, 482 - index * 18, 9);
  });
  text(details, 'Connections', 40, 250, 13, true);
  [
    ...character.connections.relationships,
    ...character.connections.affiliations,
    ...character.connections.reputations,
  ]
    .slice(0, 10)
    .forEach((item, index) =>
      text(details, item.name, 52, 228 - index * 17, 9),
    );
  text(details, 'Gear & Property', 410, 250, 13, true);
  character.possessions
    .slice(0, 10)
    .forEach((item, index) =>
      text(
        details,
        `${item.name}${item.damaged ? ' [damaged]' : ''}`,
        422,
        228 - index * 17,
        9,
      ),
    );
  text(details, 'Notes', 40, 62, 13, true);
  text(details, character.play.notes.slice(0, 250) || '-', 100, 62, 9);
  return document.save();
}
