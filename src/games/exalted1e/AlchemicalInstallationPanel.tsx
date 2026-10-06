import { DotRating } from '../../components/controls/DotRating';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
} from '../../components/layout/SheetPrimitives';
import type { Exalted1eCharacter } from './schema';
import { alchemicalCharmById } from './reference/alchemical-powers';

type AlchemicalFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'alchemical' }
>;

interface Props {
  character: Exalted1eCharacter;
  state: AlchemicalFamilyState;
  buildMode: boolean;
  onChange: (state: AlchemicalFamilyState) => void;
}

/**
 * Alchemical's Clarity Trait and Charm-Slot installation tracking
 * (Exalted: The Autochthonians, pp. 69-71 and 89-90). Mirrors
 * `LunarShapechangingPanel`/`SiderealAstrologyPanel`'s own per-family
 * sub-panel pattern rather than staying inlined in
 * `ExaltedFamilyStatePanel.tsx`.
 *
 * Clarity is tracked as the real permanent/temporary pair the source
 * describes (see `familyStateSchema`'s own `'alchemical'` branch in
 * `schema.ts` for the full rationale); each `DotRating`'s own `max` is
 * clamped to `10 - (the other rating)`, which structurally prevents the
 * UI from ever letting their sum exceed 10 rather than only catching the
 * violation after the fact at save time.
 *
 * Charm-Slot capacity (Dedicated plus General) is tracked as two plain
 * numbers; installing a Charm beyond that combined capacity is blocked
 * client-side (the checkbox disables once at capacity) in addition to the
 * schema-level `superRefine` check in `schema.ts`. The Favored/Caste-
 * Attribute restriction that real Dedicated Slots carry, and the
 * Submodule/Array reduced-installation-cost bookkeeping, remain out of
 * scope for this phase -- see `familyStateSchema`'s own doc comment.
 */
export function AlchemicalInstallationPanel({
  character,
  state,
  buildMode,
  onChange,
}: Props) {
  const ownedIds = new Set(
    character.powers.charms.map(({ definitionId }) => definitionId),
  );
  const installed = state.installedCharmIds.filter((id) => ownedIds.has(id));
  const totalSlots = state.dedicatedSlots + state.generalSlots;
  const atCapacity = installed.length >= totalSlots;
  // Each real promoted Charm's `cost` string folds its Installation Cost
  // into the same sentence (e.g. "2 motes; Installation Cost: 1 mote.")
  // rather than a separate field -- see `alchemicalCharmSchema`'s own doc
  // comment in `alchemical-powers.ts`. Charms with "Installation Cost:
  // None" (13 of 96) correctly contribute 0; the one dual-mode row
  // (Multi-Limb Frame, "None (simple) / 1 mote (permanent)") is read
  // conservatively as 0 rather than guessing which mode applies.
  const committedInstallationMotes = installed.reduce((total, id) => {
    const match = alchemicalCharmById
      .get(id)
      ?.cost?.match(/Installation Cost:\s*(\d+)/i);
    return total + (match ? Number.parseInt(match[1], 10) : 0);
  }, 0);

  return (
    <SheetCard density="compact">
      <h3>Alchemical installation</h3>
      <p className="section-note">
        Clarity (Exalted: The Autochthonians, p. 69) replaces the Limit Trait
        for this splat. Permanent Clarity is effectively irreversible (gained
        from Essence above 5 or certain installed Charms); temporary Clarity
        fluctuates with play. Their sum can never exceed 10.
      </p>
      <SheetFieldGrid columns={2}>
        <SheetField label="Permanent Clarity">
          <DotRating
            label="Permanent Clarity"
            value={state.clarityPermanent}
            max={10 - state.clarityTemporary}
            onChange={(clarityPermanent) =>
              onChange({ ...state, clarityPermanent })
            }
          />
        </SheetField>
        <SheetField label="Temporary Clarity">
          <DotRating
            label="Temporary Clarity"
            value={state.clarityTemporary}
            max={10 - state.clarityPermanent}
            onChange={(clarityTemporary) =>
              onChange({ ...state, clarityTemporary })
            }
          />
        </SheetField>
        <SheetField label="Dedicated Slots">
          <input
            type="number"
            min={0}
            value={state.dedicatedSlots}
            disabled={!buildMode}
            onChange={(event) =>
              onChange({
                ...state,
                dedicatedSlots: Number.parseInt(event.target.value, 10) || 0,
              })
            }
          />
        </SheetField>
        <SheetField label="General Slots">
          <input
            type="number"
            min={0}
            value={state.generalSlots}
            disabled={!buildMode}
            onChange={(event) =>
              onChange({
                ...state,
                generalSlots: Number.parseInt(event.target.value, 10) || 0,
              })
            }
          />
        </SheetField>
      </SheetFieldGrid>
      <p>
        {installed.length} of {totalSlots} Slots installed ·{' '}
        {committedInstallationMotes} installation motes committed
      </p>
      {character.powers.charms.map((charm) => {
        const isInstalled = state.installedCharmIds.includes(
          charm.definitionId,
        );
        return (
          <label className="choice-row" key={charm.id}>
            <input
              type="checkbox"
              checked={isInstalled}
              disabled={!isInstalled && atCapacity}
              onChange={(event) =>
                onChange({
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
              {alchemicalCharmById.get(charm.definitionId)?.name ??
                charm.definitionId}
            </span>
          </label>
        );
      })}
    </SheetCard>
  );
}
