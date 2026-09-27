import { useState } from 'react';
import { DotRating } from '../../components/controls/DotRating';
import {
  SheetBadge,
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import type { Exalted1eCharacter } from './schema';
import {
  siderealAstrologyHouses,
  siderealBlessingCurseTypes,
  siderealCollegesByHouse,
  siderealGreaterSigns,
  siderealResplendentEffects,
} from './reference/sidereal-astrology';
import astrologyRulesData from './reference/sidereal-astrology-rules.json';

type SiderealFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'sidereal' }
>;

interface Props {
  character: Exalted1eCharacter;
  state: SiderealFamilyState;
  buildMode: boolean;
  onChange: (state: SiderealFamilyState) => void;
}

const astrologyRules = astrologyRulesData as {
  id: string;
  name: string;
  summary: string;
  mechanics: string;
  cost: string;
  requirements: string;
}[];

/**
 * Sidereal's own "5-dot Colleges point buy" (per
 * sidereal-character-creation-overview) plus the fully-built Astrology/
 * Colleges reference catalog: 25 Colleges across 5 astrological Houses,
 * their ~75 named Resplendent Effects, the 5 capstone Greater Signs, the
 * 8 generic Blessing/Curse types, and the procedural rules text
 * (Effect Roll, Paradox, Pattern Bite, Censure, Petitions, Scope/
 * Duration/Power, Multiple/Canceling Effects, Resplendent Destinies).
 *
 * This app has no dice-rolling engine anywhere -- every rule below is
 * browsable reference text for the player/Storyteller to apply by hand,
 * not automated math. Only the character-facing state (College ratings,
 * which Resplendent Destinies are known/active, Paradox) is a real,
 * persisted, schema-validated Trait.
 */
export function SiderealAstrologyPanel({
  character,
  state,
  buildMode,
  onChange,
}: Props) {
  const [newDestinyCollegeId, setNewDestinyCollegeId] = useState('');
  const casteHouseId = character.identity.caste.toLocaleLowerCase();

  const setCollegeRating = (collegeId: string, rating: number) => {
    const colleges = { ...state.colleges };
    if (rating <= 0) {
      delete colleges[collegeId];
    } else {
      colleges[collegeId] = rating;
    }
    onChange({ ...state, colleges });
  };

  const addDestiny = () => {
    if (!newDestinyCollegeId) return;
    onChange({
      ...state,
      destinies: [
        ...state.destinies,
        {
          id: crypto.randomUUID(),
          collegeId: newDestinyCollegeId,
          name: '',
          active: false,
          notes: '',
        },
      ],
    });
    setNewDestinyCollegeId('');
  };

  const initiatedCollegeIds = Object.entries(state.colleges)
    .filter(([, rating]) => rating > 0)
    .map(([collegeId]) => collegeId);

  return (
    <>
      <SheetCard density="compact">
        <h3>Astrology: Colleges</h3>
        <p className="section-note">
          Initiation ratings in the 25 Colleges of Sidereal astrology (Exalted:
          The Sidereals, Chapter Six), 0-5 dots each. A rating of 1+ lets the
          character invoke that College's ascending/descending effects (see the
          Rules Reference below); a rating of 3+ in every College of a House,
          plus that House's own Caste and Essence 4+, unlocks the House's
          Greater Sign.
        </p>
        {siderealAstrologyHouses.map((house) => (
          <div className="exalted-record-group" key={house.id}>
            <h4>
              {house.name}{' '}
              <span className="empty-inline">({house.maiden})</span>
            </h4>
            <SheetFieldGrid columns={3}>
              {siderealCollegesByHouse[house.id].map((collegeEntry) => (
                <SheetField key={collegeEntry.id} label={collegeEntry.name}>
                  <DotRating
                    label={collegeEntry.name}
                    value={state.colleges[collegeEntry.id] ?? 0}
                    max={5}
                    disabled={!buildMode}
                    onChange={(rating) =>
                      setCollegeRating(collegeEntry.id, rating)
                    }
                  />
                </SheetField>
              ))}
            </SheetFieldGrid>
            <details className="exalted-compact-record">
              <summary>College details &amp; Resplendent Effects</summary>
              <div className="exalted-record-fields">
                {siderealCollegesByHouse[house.id].map((collegeEntry) => (
                  <div key={collegeEntry.id}>
                    <strong>{collegeEntry.name}</strong>
                    <p className="section-note">
                      Ascending: {collegeEntry.ascending} Descending:{' '}
                      {collegeEntry.descending}
                    </p>
                    <p className="section-note">
                      Trappings: {collegeEntry.trappings}
                    </p>
                    <p className="section-note">
                      Correlations: {collegeEntry.correlations}
                    </p>
                    <ul>
                      {siderealResplendentEffects
                        .filter(
                          (effect) => effect.collegeId === collegeEntry.id,
                        )
                        .map((effect) => (
                          <li key={effect.id}>
                            <strong>{effect.name}</strong> ({effect.cost}):{' '}
                            {effect.description}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Resplendent Destinies</h3>
        <p className="section-note">
          A resplendent destiny lets the character assume a college- flavored
          alternate identity, gaining that college's Resplendent Effects (listed
          above) without the visibility/Paradox cost of her Arcane Fate anima
          banner. Only one destiny may be active at once.
        </p>
        <div className="exalted-background-add">
          <label>
            <span>College</span>
            <select
              value={newDestinyCollegeId}
              onChange={(event) => setNewDestinyCollegeId(event.target.value)}
            >
              <option value="">Choose an initiated College</option>
              {initiatedCollegeIds.map((collegeId) => {
                const collegeEntry = siderealAstrologyHouses
                  .flatMap((house) => siderealCollegesByHouse[house.id])
                  .find((entry) => entry.id === collegeId);
                return (
                  <option key={collegeId} value={collegeId}>
                    {collegeEntry?.name ?? collegeId}
                  </option>
                );
              })}
            </select>
          </label>
          <button
            className="secondary-button"
            type="button"
            disabled={!newDestinyCollegeId}
            onClick={addDestiny}
          >
            Add destiny
          </button>
        </div>
        {initiatedCollegeIds.length === 0 ? (
          <p className="empty-inline">
            Raise a College rating above to record a Resplendent Destiny.
          </p>
        ) : null}
        {state.destinies.length ? (
          state.destinies.map((destiny) => {
            const collegeEntry = siderealAstrologyHouses
              .flatMap((house) => siderealCollegesByHouse[house.id])
              .find((entry) => entry.id === destiny.collegeId);
            return (
              <details className="exalted-compact-record" key={destiny.id}>
                <summary>
                  <strong>
                    {destiny.name || collegeEntry?.name || 'Unnamed destiny'}
                  </strong>
                  <span>{destiny.active ? 'Active' : 'Dormant'}</span>
                </summary>
                <div className="exalted-record-fields">
                  <p className="section-note">
                    College: {collegeEntry?.name ?? 'Unknown/homebrew'}
                  </p>
                  <label>
                    <span>Identity name</span>
                    <input
                      value={destiny.name}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          destinies: state.destinies.map((entry) =>
                            entry.id === destiny.id
                              ? { ...entry, name: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={destiny.active}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          destinies: state.destinies.map((entry) => ({
                            ...entry,
                            active:
                              entry.id === destiny.id
                                ? event.target.checked
                                : false,
                          })),
                        })
                      }
                    />{' '}
                    Currently assumed
                  </label>
                  <label>
                    <span>Notes</span>
                    <textarea
                      value={destiny.notes}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          destinies: state.destinies.map((entry) =>
                            entry.id === destiny.id
                              ? { ...entry, notes: event.target.value }
                              : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    className="small-button small-button--quiet"
                    type="button"
                    onClick={() =>
                      onChange({
                        ...state,
                        destinies: state.destinies.filter(
                          (entry) => entry.id !== destiny.id,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </details>
            );
          })
        ) : (
          <p className="empty-inline">No Resplendent Destinies recorded.</p>
        )}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Greater Signs</h3>
        <p className="section-note">
          Reflexive, house-wide capstone effects (10 motes, 1 permanent Essence,
          1 permanent Willpower) available only to a Chosen of the matching
          Maiden with Essence 4+ and a rating of 3+ in all five Colleges of that
          Maiden's House.
        </p>
        <ul className="exalted-record-fields">
          {siderealGreaterSigns.map((sign) => {
            const houseColleges = siderealCollegesByHouse[sign.houseId];
            const meetsColleges = houseColleges.every(
              (collegeEntry) => (state.colleges[collegeEntry.id] ?? 0) >= 3,
            );
            const meetsCaste = casteHouseId === sign.houseId;
            const meetsEssence = character.essence.rating >= 4;
            const eligible = meetsColleges && meetsCaste && meetsEssence;
            return (
              <li key={sign.id}>
                <strong>{sign.name}</strong>{' '}
                <SheetBadge tone={eligible ? 'success' : 'neutral'}>
                  {eligible ? 'Eligible' : 'Not yet eligible'}
                </SheetBadge>
                <p className="section-note">{sign.description}</p>
                {!eligible ? (
                  <p className="section-note">
                    Requires: {!meetsCaste ? 'matching Caste, ' : ''}
                    {!meetsEssence ? 'Essence 4+, ' : ''}
                    {!meetsColleges
                      ? 'rating 3+ in all five Colleges of this House.'
                      : ''}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </SheetCard>

      <SheetCard density="compact">
        <h3>Astrology &amp; Paradox rules reference</h3>
        <SheetNotice>
          Reference text only -- Arcane Record has no dice-rolling engine
          anywhere, so the Effect Roll, Scope/Duration/Power spending, and
          Paradox generation described below are applied by hand at the table.
          Track the resulting Paradox total above and the eight generic
          Blessing/Curse effect types below.
        </SheetNotice>
        {astrologyRules.map((rule) => (
          <details className="exalted-compact-record" key={rule.id}>
            <summary>
              <strong>{rule.name}</strong>
            </summary>
            <div className="exalted-record-fields">
              <p>{rule.summary}</p>
              <p className="section-note">{rule.mechanics}</p>
              <p className="section-note">Requirements: {rule.requirements}</p>
              <p className="section-note">Cost: {rule.cost}</p>
            </div>
          </details>
        ))}
        <details className="exalted-compact-record">
          <summary>
            <strong>Generic Blessing/Curse effect types</strong>
          </summary>
          <ul className="exalted-record-fields">
            {siderealBlessingCurseTypes.map((type) => (
              <li key={type.id}>
                <strong>{type.name}</strong> ({type.kind}): {type.effect}
              </li>
            ))}
          </ul>
        </details>
      </SheetCard>
    </>
  );
}
