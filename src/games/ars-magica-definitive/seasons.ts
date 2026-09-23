import { applyExperienceGain } from './experience';
import {
  arsCharacterSchema,
  seasonEventSchema,
  type ArsCharacter,
  type SeasonEvent,
} from './schema';

/** Core p. 376. This bounded workflow accepts unmodified Exposure only.
 * Other source qualities require their own verified rule adapters.
 */
export function previewExposure(
  character: ArsCharacter,
  request: {
    id: string;
    at: string;
    date: SeasonEvent['date'];
    traitIds: string[];
    explanation: string;
  },
): { character: ArsCharacter; event: SeasonEvent } {
  if (character.definition.virtuesFlaws.length)
    throw new Error(
      'Trait modifiers are not yet verified for automatic Exposure.',
    );
  if (
    character.seasons.some(
      (e) =>
        e.id === request.id ||
        (e.date.year === request.date.year &&
          e.date.season === request.date.season),
    )
  )
    throw new Error('This season already has an experience source.');
  if (
    request.traitIds.length < 1 ||
    request.traitIds.length > 2 ||
    new Set(request.traitIds).size !== request.traitIds.length
  )
    throw new Error('Exposure applies to one or two distinct Traits.');
  const quality = request.traitIds.length === 1 ? 2 : 1;
  const changes = request.traitIds.map((traitId) => {
    const trait = character.definition.traits.find((t) => t.id === traitId);
    if (!trait) throw new Error('The selected Trait no longer exists.');
    const gain = applyExperienceGain(trait.experience, quality, trait.scale);
    return {
      traitId,
      before: trait.experience,
      after: gain.total,
      sourceQuality: quality,
      advancementTotal: quality,
      awarded: quality,
    };
  });
  const event = seasonEventSchema.parse({
    ...request,
    activity: 'exposure',
    sourceRecordId: null,
    changes,
    citation: {
      sourceId: 'ars.definitive',
      book: 'Ars Magica Definitive Edition',
      printedPage: 376,
      pdfPage: 384,
    },
  });
  const next = arsCharacterSchema.parse({
    ...character,
    definition: {
      ...character.definition,
      traits: character.definition.traits.map((t) => ({
        ...t,
        experience:
          changes.find((c) => c.traitId === t.id)?.after ?? t.experience,
      })),
    },
    seasons: [...character.seasons, event],
  });
  return { character: next, event };
}
