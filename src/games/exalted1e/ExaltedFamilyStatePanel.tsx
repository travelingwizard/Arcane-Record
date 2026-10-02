import { DotRating } from '../../components/controls/DotRating';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
} from '../../components/layout/SheetPrimitives';
import type { Exalted1eCharacter } from './schema';
import { alchemicalCharms } from './reference/family-powers';
import { LunarShapechangingPanel } from './LunarShapechangingPanel';
import { SiderealAstrologyPanel } from './SiderealAstrologyPanel';

interface Props {
  character: Exalted1eCharacter;
  onChange: (character: Exalted1eCharacter) => void;
}

export function ExaltedFamilyStatePanel({ character, onChange }: Props) {
  const state = character.familyState;
  const buildMode = character.sheetLayout.mode === 'build';
  const replaceState = (nextState: typeof state) =>
    onChange({ ...character, familyState: nextState });

  if (state.type === 'solar') return null;

  if (state.type === 'dragon-blooded') {
    return (
      <SheetCard density="compact">
        <SheetField label="Anima flux">
          <input
            type="number"
            min={0}
            value={state.animaFlux}
            onChange={(event) =>
              replaceState({
                ...state,
                animaFlux: Number.parseInt(event.target.value, 10) || 0,
              })
            }
          />
        </SheetField>
      </SheetCard>
    );
  }

  if (state.type === 'lunar') {
    return (
      <>
        <SheetCard density="compact">
          <h3>Lunar state</h3>
          <SheetFieldGrid columns={2}>
            <SheetField label="Tell">
              <input
                value={state.tell}
                disabled={!buildMode}
                onChange={(event) =>
                  replaceState({ ...state, tell: event.target.value })
                }
              />
            </SheetField>
            <label className="choice-row">
              <input
                type="checkbox"
                checked={state.tattooed}
                disabled={!buildMode}
                onChange={(event) =>
                  replaceState({ ...state, tattooed: event.target.checked })
                }
              />
              <span>Moonsilver tattoos</span>
            </label>
          </SheetFieldGrid>
        </SheetCard>
        <LunarShapechangingPanel
          state={state}
          buildMode={buildMode}
          onChange={replaceState}
        />
      </>
    );
  }

  if (state.type === 'abyssal') {
    return (
      <SheetCard density="compact">
        <h3>Abyssal state</h3>
        <SheetFieldGrid columns={3}>
          <SheetField label="Liege">
            <input
              value={state.liege}
              disabled={!buildMode}
              onChange={(event) =>
                replaceState({ ...state, liege: event.target.value })
              }
            />
          </SheetField>
          <SheetField label="Resonance">
            <input
              type="number"
              min={0}
              value={state.resonance}
              onChange={(event) =>
                replaceState({
                  ...state,
                  resonance: Number.parseInt(event.target.value, 10) || 0,
                })
              }
            />
          </SheetField>
          <SheetField label="Whispers">
            <DotRating
              label="Whispers"
              value={state.whispers}
              max={5}
              disabled={!buildMode}
              onChange={(whispers) => replaceState({ ...state, whispers })}
            />
          </SheetField>
        </SheetFieldGrid>
      </SheetCard>
    );
  }

  if (state.type === 'sidereal') {
    return (
      <>
        <SheetCard density="compact">
          <h3>Sidereal state</h3>
          <SheetFieldGrid columns={2}>
            <SheetField label="Division">
              <input
                value={state.division}
                disabled={!buildMode}
                onChange={(event) =>
                  replaceState({ ...state, division: event.target.value })
                }
              />
            </SheetField>
            <SheetField label="Paradox">
              <input
                type="number"
                min={0}
                value={state.paradox}
                onChange={(event) =>
                  replaceState({
                    ...state,
                    paradox: Number.parseInt(event.target.value, 10) || 0,
                  })
                }
              />
            </SheetField>
          </SheetFieldGrid>
        </SheetCard>
        <SiderealAstrologyPanel
          character={character}
          state={state}
          buildMode={buildMode}
          onChange={replaceState}
        />
      </>
    );
  }

  if (state.type === 'alchemical') {
    const ownedIds = new Set(
      character.powers.charms.map(({ definitionId }) => definitionId),
    );
    const installed = state.installedCharmIds.filter((id) => ownedIds.has(id));
    const definitions = new Map(
      alchemicalCharms.map((charm) => [charm.id, charm]),
    );
    const committedInstallationMotes = installed.reduce((total, id) => {
      const match = definitions.get(id)?.installationCost?.match(/\d+/);
      return total + (match ? Number.parseInt(match[0], 10) : 0);
    }, 0);
    return (
      <SheetCard density="compact">
        <h3>Alchemical installation</h3>
        <SheetFieldGrid columns={2}>
          <SheetField label="Clarity">
            <DotRating
              label="Clarity"
              value={state.clarity}
              max={10}
              onChange={(clarity) => replaceState({ ...state, clarity })}
            />
          </SheetField>
          <SheetField label="Charm slots">
            <input
              type="number"
              min={0}
              value={state.charmSlots}
              disabled={!buildMode}
              onChange={(event) =>
                replaceState({
                  ...state,
                  charmSlots: Number.parseInt(event.target.value, 10) || 0,
                })
              }
            />
          </SheetField>
        </SheetFieldGrid>
        <p>
          {installed.length} installed · {state.charmSlots} recorded slots ·{' '}
          {committedInstallationMotes} installation motes
        </p>
        {character.powers.charms.map((charm) => (
          <label className="choice-row" key={charm.id}>
            <input
              type="checkbox"
              checked={state.installedCharmIds.includes(charm.definitionId)}
              onChange={(event) =>
                replaceState({
                  ...state,
                  installedCharmIds: event.target.checked
                    ? [...state.installedCharmIds, charm.definitionId]
                    : state.installedCharmIds.filter(
                        (id) => id !== charm.definitionId,
                      ),
                })
              }
            />
            <span>
              {definitions.get(charm.definitionId)?.name ?? charm.definitionId}
            </span>
          </label>
        ))}
      </SheetCard>
    );
  }

  const graceIds = ['cup', 'ring', 'staff', 'sword', 'heart'] as const;
  return (
    <SheetCard density="compact">
      <h3>Fair Folk Graces</h3>
      <SheetFieldGrid columns={3}>
        {graceIds.map((graceId) => (
          <SheetField key={graceId} label={graceId}>
            <DotRating
              label={graceId}
              value={state.graces[graceId] ?? 0}
              max={5}
              disabled={!buildMode}
              onChange={(rating) =>
                replaceState({
                  ...state,
                  graces: { ...state.graces, [graceId]: rating },
                })
              }
            />
          </SheetField>
        ))}
        <SheetField label="Active assumption">
          <input
            value={state.activeAssumption}
            onChange={(event) =>
              replaceState({ ...state, activeAssumption: event.target.value })
            }
          />
        </SheetField>
      </SheetFieldGrid>
      <SheetField label="Feeding notes">
        <textarea
          value={state.feedingNotes}
          onChange={(event) =>
            replaceState({ ...state, feedingNotes: event.target.value })
          }
        />
      </SheetField>
    </SheetCard>
  );
}
