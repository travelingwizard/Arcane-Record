import type { CityCharacter } from './schema';
export interface CityCreationIssue {
  id: string;
  message: string;
  page: number;
  source: string;
}

/** Objective starting structure only. Tag relevance and breadth remain MC decisions. */
export function cityCreationIssues(
  character: CityCharacter,
): CityCreationIssue[] {
  const issues: CityCreationIssue[] = [];
  const add = (
    id: string,
    message: string,
    page = 74,
    source = 'Player’s Guide',
  ) => issues.push({ id, message, page, source });
  const themes = character.themes.filter((theme) => theme.state !== 'archived');
  if (!character.name.trim() || !character.logos.trim())
    add('concept', 'Provide a name and an everyday-life concept.', 60);
  if (character.profile === 'rift' && !character.mythos.trim())
    add('mythos', 'Describe the legend awakening within this Rift.', 60);
  if (themes.length !== 4)
    add(
      'four-themes',
      'A starting character needs exactly four active themes.',
      64,
    );
  const supernatural = character.profile === 'rift' ? 'mythos' : 'mist';
  if (
    !themes.some((t) => t.kind === supernatural) ||
    !themes.some((t) => t.kind === 'logos') ||
    themes.some((t) => t.kind !== supernatural && t.kind !== 'logos')
  )
    add(
      'theme-balance',
      `Use one to three ${supernatural} themes and one to three Logos themes.`,
      character.profile === 'rift' ? 64 : 234,
      character.profile === 'rift' ? 'Player’s Guide' : 'Shadows & Showdowns',
    );
  if (
    character.profile === 'gatekeeper' &&
    !themes.some(
      (t) => t.kind === 'mist' && t.definitionId === 'com.theme.shrouding',
    )
  )
    add(
      'shrouding-exception',
      'Starting without a Shrouding Mist theme requires MC approval.',
      234,
      'Shadows & Showdowns',
    );
  if (
    themes
      .flatMap((t) => t.tags)
      .filter((tag) => tag.kind === 'power' && tag.broad).length > 1
  )
    add('broad-tag', 'Only one starting power tag may be broad.');
  let extraPairs = 0;
  for (const theme of themes) {
    const powers = theme.tags.filter((tag) => tag.kind === 'power');
    const weaknesses = theme.tags.filter((tag) => tag.kind === 'weakness');
    if (powers.length === 4 && weaknesses.length === 2) extraPairs += 1;
    else if (powers.length !== 3 || weaknesses.length !== 1)
      add(
        `${theme.id}.tags`,
        `${theme.name}: choose three power tags and one weakness, or the optional fourth power and second weakness together.`,
      );
    if (!theme.statement.trim())
      add(
        `${theme.id}.statement`,
        `${theme.name}: provide its ${theme.statementKind}.`,
        79,
      );
    const expectedStatement =
      theme.kind === 'mythos'
        ? 'mystery'
        : theme.kind === 'mist'
          ? 'directive'
          : 'identity';
    if (theme.statementKind !== expectedStatement)
      add(
        `${theme.id}.statement-type`,
        `${theme.name}: requires a ${expectedStatement}.`,
        theme.kind === 'mist' ? 237 : 79,
        theme.kind === 'mist' ? 'Shadows & Showdowns' : 'Player’s Guide',
      );
    if (theme.tags.some((tag) => !tag.name.trim() || !tag.questionId?.trim()))
      add(
        `${theme.id}.answers`,
        `${theme.name}: fill each tag and its themebook question letter.`,
      );
    for (const kind of ['power', 'weakness'] as const) {
      const letters = theme.tags
        .filter((tag) => tag.kind === kind)
        .map((tag) => tag.questionId?.trim().toLowerCase())
        .filter(Boolean);
      if (new Set(letters).size !== letters.length)
        add(
          `${theme.id}.${kind}-questions`,
          `${theme.name}: do not answer the same ${kind} question twice.`,
        );
    }
    if (!powers.some((tag) => tag.questionId?.trim().toLowerCase() === 'a'))
      add(
        `${theme.id}.first-question`,
        `${theme.name}: answer the first power-tag question (A).`,
      );
  }
  if (extraPairs > 1)
    add(
      'extra-pair',
      'Only one starting theme may take the additional power/weakness pair.',
    );
  return issues;
}

export function unapprovedCityIssues(character: CityCharacter) {
  const approvals = new Set(character.creation.approvals.map((a) => a.ruleId));
  return cityCreationIssues(character).filter(
    (issue) => !approvals.has(issue.id),
  );
}
