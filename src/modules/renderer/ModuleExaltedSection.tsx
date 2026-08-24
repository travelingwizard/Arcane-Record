import { useMemo, useState } from 'react';
import { DotRating } from '../../components/controls/DotRating';
import { DragonBloodedMeritsFlawsSection } from '../../games/exalted1e/DragonBloodedMeritsFlawsSection';
import { DragonBloodedPowersSection } from '../../games/exalted1e/DragonBloodedPowersSection';
import {
  abilityById,
  dragonBloodedAbilityGroups,
  solarAbilityGroups,
} from '../../games/exalted1e/definitions';
import type { DragonBloodedTraitDefinition } from '../../games/exalted1e/reference/dragonblooded-merits-flaws';
import type {
  DragonBloodedCharmDefinition,
  TerrestrialSpellDefinition,
} from '../../games/exalted1e/reference/dragonblooded-powers';
import type { Exalted1eCharacter } from '../../games/exalted1e/schema';
import { ExperienceSection } from '../../games/exalted1e/shared/advancement/ExperienceSection';
import { ComboBuilder } from '../../games/exalted1e/shared/components/ComboBuilder';
import { CombatSection } from '../../games/exalted1e/shared/components/CombatSection';
import { EquipmentSection } from '../../games/exalted1e/shared/components/EquipmentSection';
import { DerangementsSection } from '../../games/exalted1e/shared/derangements/DerangementsSection';
import type {
  AmmunitionDefinition,
  ArmorDefinition,
  WeaponDefinition,
} from '../../games/exalted1e/shared/equipment/types';
import { LanguagesSection } from '../../games/exalted1e/shared/languages/LanguagesSection';
import { PossessionsSection } from '../../games/exalted1e/shared/possessions/PossessionsSection';
import type { ModuleComponentDefinition } from '../schema/module-envelope';

type Component = Extract<
  ModuleComponentDefinition,
  { type: 'exalted1e-section' }
>;

interface CatalogValue {
  catalogKind?: string;
  id?: string;
  label?: string;
  name?: string;
  availability?: string[];
  [key: string]: unknown;
}

const path = (...segments: string[]) => ({
  root: 'character' as const,
  segments,
});

function clamp(value: string, minimum: number, maximum: number) {
  const number = Number.parseInt(value, 10);
  return Number.isNaN(number)
    ? minimum
    : Math.max(minimum, Math.min(maximum, number));
}

export function ModuleExaltedSection({
  component,
  data,
  readOnly,
  catalogEntries,
  onPathChange,
  onPathsChange,
}: {
  component: Component;
  data: Record<string, unknown>;
  readOnly: boolean;
  catalogEntries: readonly unknown[];
  onPathChange: (
    path: { root: 'character'; segments: string[] },
    value: unknown,
  ) => void;
  onPathsChange: (
    changes: Array<{
      path: { root: 'character'; segments: string[] };
      value: unknown;
    }>,
  ) => void;
}) {
  const character = data as unknown as Exalted1eCharacter;
  const entries = catalogEntries as CatalogValue[];
  const mode = (data.sheetLayout as { mode?: string } | undefined)?.mode;
  const playMode = mode === 'play';
  const replaceCharacter = (next: Exalted1eCharacter) =>
    onPathsChange(
      Object.entries(next).map(([key, value]) => ({ path: path(key), value })),
    );

  if (component.kind === 'abilities') {
    const groups =
      component.sheetType === 'solar'
        ? solarAbilityGroups
        : dragonBloodedAbilityGroups;
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Abilities</legend>
        <p className="section-note">
          Stars record Favored Abilities. Ratings and favored selections are
          protected in Play mode.
        </p>
        <div className="exalted-ability-grid">
          {groups.map((group) => (
            <div className="exalted-rating-group" key={group.id}>
              <h3>{group.label}</h3>
              {group.abilityIds.map((abilityId) => {
                const definition = abilityById.get(abilityId)!;
                const label =
                  component.sheetType === 'dragon-blooded' &&
                  abilityId === 'craft'
                    ? 'Crafts'
                    : definition.label;
                const favored = character.favoredAbilities.includes(abilityId);
                return (
                  <div className="exalted-ability-row" key={abilityId}>
                    <button
                      className="exalted-favored-toggle"
                      type="button"
                      aria-label={`${favored ? 'Clear' : 'Mark'} ${label} as favored`}
                      aria-pressed={favored}
                      onClick={() =>
                        onPathChange(
                          path('favoredAbilities'),
                          favored
                            ? character.favoredAbilities.filter(
                                (id) => id !== abilityId,
                              )
                            : [...character.favoredAbilities, abilityId],
                        )
                      }
                    >
                      <span aria-hidden="true">{favored ? '★' : '☆'}</span>
                    </button>
                    <strong>{label}</strong>
                    <DotRating
                      label={label}
                      value={character.abilities[abilityId]}
                      max={5}
                      readOnly={readOnly}
                      onChange={(rating) =>
                        onPathChange(path('abilities', abilityId), rating)
                      }
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </fieldset>
    );
  }

  if (component.kind === 'languages') {
    const definitions = entries
      .filter(({ catalogKind }) => catalogKind === 'language')
      .map(({ id, name }) => ({ id: id!, name: name! }));
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Languages</legend>
        <LanguagesSection
          languages={character.languages}
          linguistics={character.abilities.linguistics}
          definitions={definitions}
          onChange={(languages) => onPathChange(path('languages'), languages)}
        />
      </fieldset>
    );
  }

  if (component.kind === 'backgrounds') {
    return (
      <ModuleExaltedBackgrounds
        character={character}
        sheetType={component.sheetType}
        readOnly={readOnly}
        definitions={entries
          .filter(
            ({ catalogKind, availability }) =>
              catalogKind === 'background' &&
              availability?.includes(component.sheetType),
          )
          .map(({ id, label }) => ({ id: id!, label: label! }))}
        onChange={(backgrounds) =>
          onPathChange(path('backgrounds'), backgrounds)
        }
      />
    );
  }

  if (component.kind === 'advantages') {
    return (
      <div className="module-exalted-advantages">
        <div className="exalted-rating-group module-exalted-advantages__wide">
          <h3>Willpower</h3>
          <div className="exalted-rating-row">
            <strong>Permanent</strong>
            <DotRating
              label="Permanent Willpower"
              value={character.willpower.permanent}
              max={10}
              showBreakAfterFive
              readOnly={readOnly || playMode}
              onChange={(value) =>
                onPathChange(path('willpower', 'permanent'), value)
              }
            />
          </div>
          <div className="exalted-rating-row">
            <strong>Temporary</strong>
            <DotRating
              label="Temporary Willpower"
              value={character.willpower.temporary}
              max={10}
              showBreakAfterFive
              variant="boxes"
              readOnly={readOnly}
              onChange={(value) =>
                onPathChange(path('willpower', 'temporary'), value)
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
              value={character.essence.rating}
              min={1}
              max={6}
              showBreakAfterFive
              readOnly={readOnly || playMode}
              onChange={(value) =>
                onPathChange(path('essence', 'rating'), value)
              }
            />
          </div>
          <div className="exalted-pool-grid">
            {(['personal', 'peripheral', 'committed'] as const).map((field) => (
              <label key={field}>
                <span>{field[0]!.toUpperCase() + field.slice(1)}</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={character.essence[field]}
                  readOnly={readOnly}
                  onChange={(event) =>
                    onPathChange(
                      path('essence', field),
                      clamp(event.target.value, 0, 999),
                    )
                  }
                />
              </label>
            ))}
          </div>
        </div>
        {component.sheetType === 'solar' ? (
          <div className="exalted-rating-group">
            <h3>Limit Break</h3>
            <DotRating
              label="Limit Break"
              value={character.limit.rating}
              max={10}
              showBreakAfterFive
              variant="boxes"
              readOnly={readOnly}
              onChange={(value) => onPathChange(path('limit', 'rating'), value)}
            />
            <label>
              <span>Virtue Flaw / Great Curse</span>
              <textarea
                value={character.limit.virtueFlaw}
                readOnly={readOnly || playMode}
                onChange={(event) =>
                  onPathChange(path('limit', 'virtueFlaw'), event.target.value)
                }
              />
            </label>
          </div>
        ) : (
          <div className="exalted-rating-group">
            <h3>Great Curse</h3>
            <p className="section-note">
              Great Curse notes remain separate from Derangement records.
            </p>
            <label>
              <span>Manifestation notes</span>
              <textarea
                value={character.limit.virtueFlaw}
                readOnly={readOnly || playMode}
                onChange={(event) =>
                  onPathChange(path('limit', 'virtueFlaw'), event.target.value)
                }
              />
            </label>
          </div>
        )}
      </div>
    );
  }

  if (component.kind === 'merits-flaws') {
    const definitions = entries.filter(
      ({ catalogKind }) => catalogKind === 'trait',
    ) as unknown as DragonBloodedTraitDefinition[];
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Merits and Flaws</legend>
        <DragonBloodedMeritsFlawsSection
          traits={character.meritsFlaws}
          definitions={definitions}
          onChange={(value) => onPathChange(path('meritsFlaws'), value)}
          derangements={character.derangements}
          onDerangementsChange={(value) =>
            onPathChange(path('derangements'), value)
          }
        />
      </fieldset>
    );
  }

  if (component.kind === 'derangements') {
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Derangements</legend>
        <DerangementsSection
          derangements={character.derangements}
          onChange={(value) => onPathChange(path('derangements'), value)}
        />
      </fieldset>
    );
  }

  if (component.kind === 'powers') {
    const definitions = entries.filter(
      ({ catalogKind }) => catalogKind === 'charm' || catalogKind === 'spell',
    ) as unknown as (
      DragonBloodedCharmDefinition | TerrestrialSpellDefinition
    )[];
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Charms and Sorcery</legend>
        <DragonBloodedPowersSection
          powers={character.powers}
          definitions={definitions}
          character={character}
          onChange={(value) => onPathChange(path('powers'), value)}
          onLearnWithExperience={(definition, cost, explanation) => {
            const now = new Date();
            onPathsChange([
              {
                path: path(
                  'powers',
                  definition.kind === 'charm' ? 'charms' : 'spells',
                ),
                value: [
                  ...character.powers[
                    definition.kind === 'charm' ? 'charms' : 'spells'
                  ],
                  {
                    id: crypto.randomUUID(),
                    definitionId: definition.id,
                    unresolvedReference: null,
                    notes: '',
                  },
                ],
              },
              {
                path: path('experienceLedger'),
                value: [
                  ...character.experienceLedger,
                  {
                    id: crypto.randomUUID(),
                    date: now.toISOString().slice(0, 10),
                    session: '',
                    type: 'purchase',
                    amount: -cost,
                    category: definition.kind === 'charm' ? 'Charm' : 'Spell',
                    targetId: definition.id,
                    targetName: definition.name,
                    previousRating: null,
                    newRating: null,
                    description: `Learned ${definition.name}`,
                    notes: explanation,
                    createdAt: now.toISOString(),
                  },
                ],
              },
            ]);
          }}
        />
      </fieldset>
    );
  }

  if (component.kind === 'equipment') {
    const weapons = entries.filter(
      ({ catalogKind }) => catalogKind === 'weapon',
    ) as unknown as WeaponDefinition[];
    const armor = entries.filter(
      ({ catalogKind }) => catalogKind === 'armor',
    ) as unknown as ArmorDefinition[];
    const ammunition = entries.filter(
      ({ catalogKind }) => catalogKind === 'ammunition',
    ) as unknown as AmmunitionDefinition[];
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Equipment</legend>
        <EquipmentSection
          equipment={character.equipment}
          definitions={{ weapons, armor, ammunition }}
          onChange={(value) => onPathChange(path('equipment'), value)}
        />
      </fieldset>
    );
  }

  if (component.kind === 'combat') {
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Combat</legend>
        <CombatSection
          character={character}
          onCombatChange={(value) => onPathChange(path('combat'), value)}
        />
      </fieldset>
    );
  }

  if (component.kind === 'combos') {
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Combos</legend>
        <ComboBuilder
          character={character}
          onChange={(value) => onPathChange(path('combos'), value)}
        />
      </fieldset>
    );
  }

  if (component.kind === 'possessions') {
    return (
      <fieldset className="module-exalted-fieldset" disabled={readOnly}>
        <legend className="visually-hidden">Possessions</legend>
        <PossessionsSection character={character} onChange={replaceCharacter} />
      </fieldset>
    );
  }

  return (
    <fieldset className="module-exalted-fieldset" disabled={readOnly}>
      <legend className="visually-hidden">Experience</legend>
      <ExperienceSection character={character} onChange={replaceCharacter} />
    </fieldset>
  );
}

function ModuleExaltedBackgrounds({
  character,
  sheetType,
  readOnly,
  definitions,
  onChange,
}: {
  character: Exalted1eCharacter;
  sheetType: 'solar' | 'dragon-blooded';
  readOnly: boolean;
  definitions: { id: string; label: string }[];
  onChange: (backgrounds: Exalted1eCharacter['backgrounds']) => void;
}) {
  const [choice, setChoice] = useState('');
  const byId = useMemo(
    () => new Map(definitions.map((entry) => [entry.id, entry])),
    [definitions],
  );
  return (
    <fieldset className="module-exalted-fieldset" disabled={readOnly}>
      <legend className="visually-hidden">Backgrounds</legend>
      <p className="section-note">
        Availability comes from the shared module catalog for the {sheetType}{' '}
        child sheet. Unknown imported definitions remain visible and removable.
      </p>
      <div className="exalted-background-add">
        <label>
          <span>Background</span>
          <select
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
          >
            <option value="">Choose a Background</option>
            {definitions.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="secondary-button"
          disabled={!choice}
          onClick={() => {
            if (!choice) return;
            onChange([
              ...character.backgrounds,
              {
                id: crypto.randomUUID(),
                definitionId: choice,
                rating: 0,
                notes: '',
                label: '',
                description: '',
                linkedEntityIds: [],
                createdAt: new Date().toISOString(),
                unresolvedReference: null,
              } as Exalted1eCharacter['backgrounds'][number],
            ]);
            setChoice('');
          }}
        >
          Add Background
        </button>
      </div>
      <div className="exalted-background-list">
        {character.backgrounds.map((background) => {
          const definition = byId.get(background.definitionId);
          const unresolved = !definition;
          return (
            <article key={background.id}>
              <div className="exalted-rating-row">
                <strong>
                  {definition?.label ??
                    (background.label || background.definitionId)}
                </strong>
                <DotRating
                  label={definition?.label ?? background.definitionId}
                  value={background.rating}
                  max={5}
                  readOnly={readOnly}
                  onChange={(rating) =>
                    onChange(
                      character.backgrounds.map((entry) =>
                        entry.id === background.id
                          ? { ...entry, rating }
                          : entry,
                      ),
                    )
                  }
                />
              </div>
              {unresolved ? (
                <p className="notice notice--warning" role="status">
                  Unresolved definition “{background.definitionId}”. This owned
                  record is preserved for repair.
                </p>
              ) : null}
              <label>
                <span>Instance label</span>
                <input
                  value={background.label}
                  onChange={(event) =>
                    onChange(
                      character.backgrounds.map((entry) =>
                        entry.id === background.id
                          ? { ...entry, label: event.target.value }
                          : entry,
                      ),
                    )
                  }
                />
              </label>
              <label>
                <span>Notes</span>
                <textarea
                  value={background.notes}
                  onChange={(event) =>
                    onChange(
                      character.backgrounds.map((entry) =>
                        entry.id === background.id
                          ? { ...entry, notes: event.target.value }
                          : entry,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="small-button small-button--quiet"
                onClick={() =>
                  onChange(
                    character.backgrounds.filter(
                      ({ id }) => id !== background.id,
                    ),
                  )
                }
              >
                Remove
              </button>
            </article>
          );
        })}
      </div>
    </fieldset>
  );
}
