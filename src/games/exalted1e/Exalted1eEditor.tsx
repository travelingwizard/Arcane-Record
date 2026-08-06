import { useCallback, useEffect, useMemo, useState } from 'react';
import { SaveStatusBadge } from '../../components/character/SaveStatusBadge';
import { DotRating } from '../../components/controls/DotRating';
import type { SaveStatus } from '../../state/editor-store';
import type { GameCharacterEditorProps } from '../game-system';
import {
  abilityById,
  dragonBloodedAbilityGroups,
  dragonBloodedBackgrounds,
  EXALTED1E_SCHEMA_VERSION,
  exaltedAttributeGroups,
  exaltedVirtues,
  solarAbilityGroups,
  solarBackgrounds,
  type ExaltedAbilityId,
  type ExaltedAttributeGroupId,
  type ExaltedAttributeId,
  type ExaltedVirtueId,
} from './definitions';
import { exalted1eCharacterSchema, type Exalted1eCharacter } from './schema';

const AUTOSAVE_DELAY_MS = 550;

function clampInteger(value: string, maximum = 999) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(maximum, parsed));
}

function getAttributeRating(
  character: Exalted1eCharacter,
  groupId: ExaltedAttributeGroupId,
  attributeId: ExaltedAttributeId,
) {
  return (
    character.attributes[groupId] as Partial<Record<ExaltedAttributeId, number>>
  )[attributeId]!;
}

export function Exalted1eEditor({
  record,
  character,
  repository,
  onBack,
  onRecordChanged,
}: GameCharacterEditorProps<Exalted1eCharacter>) {
  const [draft, setDraft] = useState(character);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [backgroundChoice, setBackgroundChoice] = useState('');
  const isSolar = draft.sheetType === 'solar';
  const sheetName = isSolar ? 'Solar' : 'Dragon-Blooded';
  const abilityGroups = isSolar
    ? solarAbilityGroups
    : dragonBloodedAbilityGroups;
  const backgroundDefinitions = isSolar
    ? solarBackgrounds
    : dragonBloodedBackgrounds;
  const backgroundById = new Map(
    backgroundDefinitions.map((background) => [background.id, background]),
  );
  const availableBackgrounds = backgroundDefinitions.filter(
    ({ id }) =>
      !draft.backgrounds.some((background) => background.definitionId === id),
  );

  const save = useCallback(
    async (candidate: Exalted1eCharacter) => {
      setSaveStatus('saving');
      try {
        const validated = exalted1eCharacterSchema.parse(candidate);
        const stored = await repository.save({
          ...record,
          name: validated.identity.name,
          systemVersion: EXALTED1E_SCHEMA_VERSION,
          data: validated,
        });
        onRecordChanged(stored);
        setSaveStatus('saved');
        return true;
      } catch {
        setSaveStatus('error');
        return false;
      }
    },
    [onRecordChanged, record, repository],
  );

  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = window.setTimeout(() => void save(draft), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft, save, saveStatus]);

  const update = (
    updater: (current: Exalted1eCharacter) => Exalted1eCharacter,
  ) => {
    setDraft((current) => exalted1eCharacterSchema.parse(updater(current)));
    setSaveStatus('unsaved');
  };

  const returnToLibrary = async () => {
    if (saveStatus !== 'saved') {
      if (!(await save(draft))) return;
    }
    await onBack();
  };

  const updateIdentity = (
    field: keyof Exalted1eCharacter['identity'],
    value: string,
  ) =>
    update((current) => ({
      ...current,
      identity: { ...current.identity, [field]: value },
    }));

  const updateAttribute = (
    groupId: ExaltedAttributeGroupId,
    attributeId: ExaltedAttributeId,
    rating: number,
  ) =>
    update((current) => ({
      ...current,
      attributes: {
        ...current.attributes,
        [groupId]: {
          ...current.attributes[groupId],
          [attributeId]: rating,
        },
      },
    }));

  const updateAbility = (abilityId: ExaltedAbilityId, rating: number) =>
    update((current) => ({
      ...current,
      abilities: { ...current.abilities, [abilityId]: rating },
    }));

  const toggleFavoredAbility = (abilityId: ExaltedAbilityId) =>
    update((current) => ({
      ...current,
      favoredAbilities: current.favoredAbilities.includes(abilityId)
        ? current.favoredAbilities.filter((id) => id !== abilityId)
        : [...current.favoredAbilities, abilityId],
    }));

  const displayName = draft.identity.name.trim() || `Untitled ${sheetName}`;
  const sectionLinks = useMemo(
    () => [
      ['exalted-identity', 'Character'],
      ['exalted-attributes', 'Attributes'],
      ['exalted-abilities', 'Abilities'],
      ['exalted-backgrounds', 'Backgrounds'],
      ['exalted-advantages', 'Advantages'],
      ['exalted-notes', 'Notes'],
      ['exalted-later-pages', 'Later pages'],
    ],
    [],
  );

  return (
    <main className="app-shell exalted-editor-shell">
      <header className="exalted-editor-header">
        <button className="text-button" onClick={() => void returnToLibrary()}>
          ← Character library
        </button>
        <div>
          <p className="eyebrow">Arcane Record · Exalted First Edition</p>
          <h1>{displayName}</h1>
          <p>{sheetName} character sheet foundation</p>
        </div>
        <SaveStatusBadge status={saveStatus} />
      </header>

      <nav className="exalted-section-nav" aria-label="Exalted sheet sections">
        {sectionLinks.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <section id="exalted-identity" className="exalted-sheet-section">
        <p className="eyebrow">Page one</p>
        <h2>Character</h2>
        <div className="exalted-field-grid">
          <label>
            <span>Name</span>
            <input
              value={draft.identity.name}
              onChange={(event) => updateIdentity('name', event.target.value)}
            />
          </label>
          <label>
            <span>Player</span>
            <input
              value={draft.identity.player}
              onChange={(event) => updateIdentity('player', event.target.value)}
            />
          </label>
          <label>
            <span>Concept</span>
            <input
              value={draft.identity.concept}
              onChange={(event) =>
                updateIdentity('concept', event.target.value)
              }
            />
          </label>
          <label>
            <span>Nature</span>
            <input
              value={draft.identity.nature}
              onChange={(event) => updateIdentity('nature', event.target.value)}
            />
          </label>
          {isSolar ? (
            <label>
              <span>Caste</span>
              <input
                value={draft.identity.caste}
                onChange={(event) =>
                  updateIdentity('caste', event.target.value)
                }
              />
            </label>
          ) : (
            <>
              <label>
                <span>Aspect</span>
                <input
                  value={draft.identity.aspect}
                  onChange={(event) =>
                    updateIdentity('aspect', event.target.value)
                  }
                />
              </label>
              <label>
                <span>House</span>
                <input
                  value={draft.identity.house}
                  onChange={(event) =>
                    updateIdentity('house', event.target.value)
                  }
                />
              </label>
            </>
          )}
          <label>
            <span>Anima</span>
            <input
              value={draft.identity.anima}
              onChange={(event) => updateIdentity('anima', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section id="exalted-attributes" className="exalted-sheet-section">
        <p className="eyebrow">Core traits</p>
        <h2>Attributes</h2>
        <div className="exalted-rating-columns">
          {exaltedAttributeGroups.map((group) => (
            <div className="exalted-rating-group" key={group.id}>
              <h3>{group.label}</h3>
              {group.traits.map((trait) => (
                <div className="exalted-rating-row" key={trait.id}>
                  <strong>{trait.label}</strong>
                  <DotRating
                    label={trait.label}
                    value={getAttributeRating(draft, group.id, trait.id)}
                    min={1}
                    max={5}
                    onChange={(rating) =>
                      updateAttribute(group.id, trait.id, rating)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section id="exalted-abilities" className="exalted-sheet-section">
        <p className="eyebrow">
          {isSolar ? 'Caste groupings' : 'Elemental groupings'}
        </p>
        <h2>Abilities</h2>
        <p className="section-note">
          The star records a favored Ability; it does not enforce
          character-creation rules.
        </p>
        <div className="exalted-ability-grid">
          {abilityGroups.map((group) => (
            <div className="exalted-rating-group" key={group.id}>
              <h3>{group.label}</h3>
              {group.abilityIds.map((abilityId) => {
                const ability = abilityById.get(abilityId)!;
                const abilityLabel =
                  !isSolar && abilityId === 'craft' ? 'Crafts' : ability.label;
                const favored = draft.favoredAbilities.includes(abilityId);
                return (
                  <div className="exalted-ability-row" key={abilityId}>
                    <button
                      className="exalted-favored-toggle"
                      type="button"
                      aria-label={`${favored ? 'Clear' : 'Mark'} ${abilityLabel} as favored`}
                      aria-pressed={favored}
                      onClick={() => toggleFavoredAbility(abilityId)}
                    >
                      <span aria-hidden="true">{favored ? '★' : '☆'}</span>
                    </button>
                    <strong>{abilityLabel}</strong>
                    <DotRating
                      label={abilityLabel}
                      value={draft.abilities[abilityId]}
                      max={5}
                      onChange={(rating) => updateAbility(abilityId, rating)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section id="exalted-backgrounds" className="exalted-sheet-section">
        <p className="eyebrow">Sheet-specific list</p>
        <h2>Backgrounds</h2>
        <div className="exalted-background-add">
          <label>
            <span>Background</span>
            <select
              value={backgroundChoice}
              onChange={(event) => setBackgroundChoice(event.target.value)}
            >
              <option value="">Choose a Background</option>
              {availableBackgrounds.map((background) => (
                <option key={background.id} value={background.id}>
                  {background.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            disabled={!backgroundChoice}
            onClick={() => {
              const chosenBackground = backgroundDefinitions.find(
                (background) => background.id === backgroundChoice,
              );
              if (!chosenBackground) return;
              update((current) => ({
                ...current,
                backgrounds: [
                  ...current.backgrounds,
                  {
                    id: crypto.randomUUID(),
                    definitionId: chosenBackground.id,
                    rating: 0,
                    notes: '',
                  },
                ],
              }));
              setBackgroundChoice('');
            }}
          >
            Add Background
          </button>
        </div>
        {draft.backgrounds.length ? (
          <div className="exalted-background-list">
            {draft.backgrounds.map((background) => (
              <article key={background.id}>
                <div className="exalted-rating-row">
                  <strong>
                    {backgroundById.get(background.definitionId)?.label ??
                      background.definitionId}
                  </strong>
                  <DotRating
                    label={
                      backgroundById.get(background.definitionId)?.label ??
                      background.definitionId
                    }
                    value={background.rating}
                    max={5}
                    onChange={(rating) =>
                      update((current) => ({
                        ...current,
                        backgrounds: current.backgrounds.map((entry) =>
                          entry.id === background.id
                            ? { ...entry, rating }
                            : entry,
                        ),
                      }))
                    }
                  />
                </div>
                <label>
                  <span>Notes</span>
                  <input
                    value={background.notes}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        backgrounds: current.backgrounds.map((entry) =>
                          entry.id === background.id
                            ? { ...entry, notes: event.target.value }
                            : entry,
                        ),
                      }))
                    }
                  />
                </label>
                <button
                  className="small-button small-button--quiet"
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      backgrounds: current.backgrounds.filter(
                        (entry) => entry.id !== background.id,
                      ),
                    }))
                  }
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-inline">No Backgrounds recorded yet.</p>
        )}
      </section>

      <section id="exalted-advantages" className="exalted-sheet-section">
        <p className="eyebrow">Page-one tracks</p>
        <h2>Advantages</h2>
        <div className="exalted-advantage-grid">
          <div className="exalted-rating-group">
            <h3>Virtues</h3>
            {exaltedVirtues.map((virtue) => (
              <div className="exalted-rating-row" key={virtue.id}>
                <strong>{virtue.label}</strong>
                <DotRating
                  label={virtue.label}
                  value={draft.virtues[virtue.id]}
                  max={5}
                  onChange={(rating) =>
                    update((current) => ({
                      ...current,
                      virtues: {
                        ...current.virtues,
                        [virtue.id as ExaltedVirtueId]: rating,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="exalted-rating-group">
            <h3>Willpower</h3>
            <div className="exalted-rating-row">
              <strong>Permanent</strong>
              <DotRating
                label="Willpower"
                value={draft.willpower.permanent}
                max={10}
                showBreakAfterFive
                onChange={(permanent) =>
                  update((current) => ({
                    ...current,
                    willpower: { ...current.willpower, permanent },
                  }))
                }
              />
            </div>
            <div className="exalted-rating-row">
              <strong>Temporary</strong>
              <DotRating
                label="Temporary Willpower"
                value={draft.willpower.temporary}
                max={10}
                showBreakAfterFive
                variant="boxes"
                onChange={(temporary) =>
                  update((current) => ({
                    ...current,
                    willpower: { ...current.willpower, temporary },
                  }))
                }
              />
            </div>
          </div>
          <div className="exalted-rating-group">
            <h3>Essence</h3>
            <div className="exalted-rating-row">
              <strong>Rating</strong>
              <DotRating
                label="Essence"
                value={draft.essence.rating}
                min={1}
                max={6}
                showBreakAfterFive
                onChange={(rating) =>
                  update((current) => ({
                    ...current,
                    essence: { ...current.essence, rating },
                  }))
                }
              />
            </div>
            <div className="exalted-pool-grid">
              {(['personal', 'peripheral', 'committed'] as const).map(
                (field) => (
                  <label key={field}>
                    <span>{field[0].toUpperCase() + field.slice(1)}</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={draft.essence[field]}
                      onChange={(event) =>
                        update((current) => ({
                          ...current,
                          essence: {
                            ...current.essence,
                            [field]: clampInteger(event.target.value),
                          },
                        }))
                      }
                    />
                  </label>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="exalted-limit-grid">
          {isSolar ? (
            <div>
              <h3>Limit Break</h3>
              <DotRating
                label="Limit Break"
                value={draft.limit.rating}
                max={10}
                showBreakAfterFive
                variant="boxes"
                onChange={(rating) =>
                  update((current) => ({
                    ...current,
                    limit: { ...current.limit, rating },
                  }))
                }
              />
            </div>
          ) : null}
          <label>
            <span>Virtue Flaw</span>
            <textarea
              value={draft.limit.virtueFlaw}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  limit: { ...current.limit, virtueFlaw: event.target.value },
                }))
              }
            />
          </label>
        </div>
      </section>

      <section id="exalted-notes" className="exalted-sheet-section">
        <p className="eyebrow">Initial free-form records</p>
        <h2>Anima, Weapons, and Experience</h2>
        <div className="exalted-notes-grid">
          {(['anima', 'weapons', 'experience'] as const).map((field) => (
            <label key={field}>
              <span>{field[0].toUpperCase() + field.slice(1)}</span>
              <textarea
                value={draft.notes[field]}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    notes: { ...current.notes, [field]: event.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section
        id="exalted-later-pages"
        className="exalted-sheet-section exalted-later-pages"
      >
        <p className="eyebrow">Foundation milestone</p>
        <h2>Later sheet pages</h2>
        <p>
          The source sheets also contain the following areas. They are
          documented for the next implementation pass and are not editable yet.
        </p>
        <ul>
          <li>Merits and Flaws</li>
          <li>Charms and Sorcery</li>
          <li>Combos, combat, and armor</li>
          <li>Expanded Background details and possessions</li>
          <li>Languages, derangements, and experience history</li>
          <li>History, description, and character sketch</li>
        </ul>
      </section>
    </main>
  );
}
