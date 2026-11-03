import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnSources,
  earthdawnSpells,
  type EarthdawnDefinition,
} from './catalog';
import { earthdawnPathProfiles } from './path-profiles';

const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLocaleLowerCase();

export const isUnavailableCatalogText = (value: string | null | undefined) =>
  /^not in source(?:\b|\s*\()/i.test(value?.trim() ?? '');

export const displayCatalogText = (value: string | null | undefined) =>
  isUnavailableCatalogText(value) ? '' : (value ?? '');

export type EarthdawnCatalogAudit = {
  errors: string[];
  unavailableFields: number;
  definitions: number;
  variants: number;
};

export function auditEarthdawnCatalog(
  catalog: readonly EarthdawnDefinition[] = earthdawnCatalog,
): EarthdawnCatalogAudit {
  const errors: string[] = [];
  const sourceIds = new Set(earthdawnSources.map(({ id }) => id));
  const ids = new Set<string>();
  const identities = new Map<string, string>();
  const variantKeys = new Set<string>();
  let unavailableFields = 0;
  let variants = 0;

  for (const definition of catalog) {
    if (ids.has(definition.id)) errors.push(`Duplicate ID: ${definition.id}`);
    ids.add(definition.id);
    if (!definition.id.trim() || !definition.name.trim())
      errors.push(`Empty identity: ${definition.id || definition.name}`);
    if (!sourceIds.has(definition.sourceId))
      errors.push(`Unknown source ${definition.sourceId}: ${definition.id}`);
    for (const sourceId of definition.sourceIds ?? [])
      if (!sourceIds.has(sourceId))
        errors.push(
          `Unknown supplemental source ${sourceId}: ${definition.id}`,
        );
    if (
      definition.page != null &&
      (!Number.isInteger(definition.page) || definition.page < 1)
    )
      errors.push(`Malformed page ${definition.page}: ${definition.id}`);
    if (
      definition.pageEnd != null &&
      (!Number.isInteger(definition.pageEnd) ||
        definition.pageEnd < (definition.page ?? 1))
    )
      errors.push(`Malformed page end ${definition.pageEnd}: ${definition.id}`);
    if (definition.requirements.some((value) => !value.trim()))
      errors.push(`Empty requirement: ${definition.id}`);

    const identity = `${definition.kind}:${definition.kind === 'skill' ? `${definition.skillCategory}:` : ''}${normalize(definition.name)}`;
    const priorIdentity = identities.get(identity);
    if (priorIdentity && priorIdentity !== definition.id)
      errors.push(
        `Normalized identity collision: ${priorIdentity} and ${definition.id}`,
      );
    identities.set(identity, definition.id);

    const aliases = new Set<string>();
    for (const alias of definition.aliases) {
      const normalized = normalize(alias);
      if (
        !normalized ||
        alias.trim().toLocaleLowerCase() ===
          definition.name.trim().toLocaleLowerCase()
      )
        errors.push(`Redundant alias ${alias}: ${definition.id}`);
      if (aliases.has(normalized))
        errors.push(`Duplicate alias ${alias}: ${definition.id}`);
      aliases.add(normalized);
    }

    const unavailableValues = [
      definition.summary,
      definition.mechanics,
      definition.talentMetadata?.attributeText,
      definition.talentMetadata?.effectText,
      definition.talentMetadata?.actionText,
      definition.talentMetadata?.strainText,
      definition.talentMetadata?.descriptionText,
      definition.talentMetadata?.requirementsText,
      definition.spellMetadata?.threadsText,
      definition.spellMetadata?.difficultyText,
      definition.spellMetadata?.effectText,
    ];
    unavailableFields += unavailableValues.filter(
      isUnavailableCatalogText,
    ).length;

    for (const variant of definition.knackMetadata?.variants ?? []) {
      variants += 1;
      if (!variant.key.trim() || variantKeys.has(variant.key))
        errors.push(`Duplicate or empty knack variant key: ${variant.key}`);
      variantKeys.add(variant.key);
      if (!sourceIds.has(variant.sourceId))
        errors.push(`Unknown knack source ${variant.sourceId}: ${variant.key}`);
      if (
        variant.page != null &&
        (!Number.isInteger(variant.page) || variant.page < 1)
      )
        errors.push(`Malformed knack page ${variant.page}: ${variant.key}`);
      if (!variant.association.trim() || !variant.description.trim())
        errors.push(`Empty knack variant field: ${variant.key}`);
    }
    for (const variant of definition.spellMetadata?.variants ?? []) {
      variants += 1;
      if (!sourceIds.has(variant.sourceId))
        errors.push(
          `Unknown spell source ${variant.sourceId}: ${definition.id}`,
        );
      if (
        variant.pageStart != null &&
        (!Number.isInteger(variant.pageStart) || variant.pageStart < 1)
      )
        errors.push(`Malformed spell page: ${definition.id}`);
      if (variant.circleMin < 1 || variant.circleMax < variant.circleMin)
        errors.push(`Malformed spell Circle: ${definition.id}`);
    }
  }

  const talentNames = new Set(
    catalog
      .filter(({ kind }) => kind === 'talent')
      .map(({ name }) => normalize(name)),
  );
  for (const discipline of earthdawnDisciplines.filter(({ id }) =>
    [
      'ed4.discipline.gauntlet',
      'ed4.discipline.shaman',
      'ed4.discipline.marauder',
    ].includes(id),
  )) {
    if (
      discipline.circles.length !== 15 ||
      discipline.circles.some(({ circle }, index) => circle !== index + 1)
    )
      errors.push(`Malformed Discipline progression: ${discipline.id}`);
    const expectedOptionCounts = {
      novice: 10,
      journeyman: 10,
      warden: 10,
      master: 8,
    } as const;
    for (const [tier, count] of Object.entries(expectedOptionCounts))
      if (
        discipline.talentOptions[tier as keyof typeof expectedOptionCounts]
          .length !== count
      )
        errors.push(`Malformed ${tier} options: ${discipline.id}`);
    const referencedTalents = [
      ...discipline.circles.flatMap(({ requiredTalents }) => requiredTalents),
      ...Object.values(discipline.talentOptions).flat(),
    ];
    for (const talent of new Set(referencedTalents))
      if (!talentNames.has(normalize(talent)))
        errors.push(`Unknown Discipline talent ${talent}: ${discipline.id}`);
  }

  if (earthdawnDisciplines.some(({ halfMagic }) => !halfMagic?.trim()))
    errors.push('Every official Discipline must define Half-Magic.');
  if (earthdawnPathProfiles.some(({ halfMagic }) => !halfMagic.trim()))
    errors.push('Every Mystic Path must define Half-Magic.');

  const shamanSpellCircles = new Set(
    earthdawnSpells.flatMap(
      ({ spellMetadata }) =>
        spellMetadata?.variants
          .filter(({ discipline }) => discipline === 'Shaman')
          .flatMap(({ circleMin, circleMax }) =>
            Array.from(
              { length: circleMax - circleMin + 1 },
              (_, index) => circleMin + index,
            ),
          ) ?? [],
    ),
  );
  for (let circle = 1; circle <= 15; circle += 1)
    if (!shamanSpellCircles.has(circle))
      errors.push(`Missing Shaman spell Circle: ${circle}`);

  return { errors, unavailableFields, definitions: catalog.length, variants };
}
