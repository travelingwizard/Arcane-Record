import { DotRating } from '../../components/controls/DotRating';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
} from '../../components/layout/SheetPrimitives';
import type { Exalted1eCharacter } from './schema';
import { AlchemicalInstallationPanel } from './AlchemicalInstallationPanel';
import { FairFolkGracesPanel } from './FairFolkGracesPanel';
import { LunarShapechangingPanel } from './LunarShapechangingPanel';
import { SiderealAstrologyPanel } from './SiderealAstrologyPanel';
import { fairFolkGraces } from './definitions';

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
    return (
      <AlchemicalInstallationPanel
        character={character}
        state={state}
        buildMode={buildMode}
        onChange={replaceState}
      />
    );
  }

  return (
    <>
      <SheetCard density="compact">
        <h3>Fair Folk Graces</h3>
        <SheetFieldGrid columns={3}>
          {fairFolkGraces.map((grace) => (
            <SheetField key={grace.id} label={grace.label}>
              <DotRating
                label={grace.label}
                value={state.graces[grace.id] ?? 0}
                max={5}
                disabled={!buildMode}
                onChange={(rating) =>
                  replaceState({
                    ...state,
                    graces: { ...state.graces, [grace.id]: rating },
                  })
                }
              />
            </SheetField>
          ))}
          <SheetField label="Active assumption">
            <input
              value={state.activeAssumption}
              onChange={(event) =>
                replaceState({
                  ...state,
                  activeAssumption: event.target.value,
                })
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
      <FairFolkGracesPanel
        state={state}
        buildMode={buildMode}
        onChange={replaceState}
      />
    </>
  );
}
