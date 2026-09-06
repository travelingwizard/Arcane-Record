import { useMemo, useState } from 'react';
import type { ExaltedAbilityId } from '../../definitions';
import type { Exalted1eCharacter } from '../../schema';
import { dragonBloodedCharmById } from '../../reference/dragonblooded-powers';
import { calculateAttacks, calculateProtection } from '../combat/calculations';
import type { CombatProfile } from '../equipment/types';

interface Props {
  character: Exalted1eCharacter;
  onCombatChange: (combat: Exalted1eCharacter['combat']) => void;
}

function signed(value: number | null) {
  if (value === null) return '—';
  return value >= 0 ? `+${value}` : `${value}`;
}

function damageType(type: string) {
  return type === 'bashing' ? 'B' : type === 'lethal' ? 'L' : 'A';
}

export function CombatSection({ character, onCombatChange }: Props) {
  const [specialtyAbility, setSpecialtyAbility] =
    useState<ExaltedAbilityId>('melee');
  const [specialtyLabel, setSpecialtyLabel] = useState('');
  const attacks = useMemo(() => calculateAttacks(character), [character]);
  const protection = useMemo(() => calculateProtection(character), [character]);
  const initiative =
    character.attributes.physical.dexterity +
    character.attributes.mental.wits +
    character.combat.staticInitiativeModifier +
    character.combat.woundPenalty;
  const dodge =
    character.attributes.physical.dexterity +
    character.abilities.dodge +
    character.combat.staticDodgeModifier +
    protection.mobilityPenalty +
    character.combat.woundPenalty;

  const updateProfile = (profile: CombatProfile) =>
    onCombatChange({ ...character.combat, profile });

  return (
    <div className="exalted-combat-section">
      <fieldset className="exalted-profile-switch">
        <legend>Combat profile</legend>
        {(
          [
            ['classic', 'Classic'],
            ['power-combat', 'Power Combat'],
          ] as const
        ).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="combat-profile"
              value={value}
              checked={character.combat.profile === value}
              onChange={() => updateProfile(value)}
            />{' '}
            {label}
          </label>
        ))}
      </fieldset>
      <p className="section-note" role="status">
        {character.combat.profile === 'classic'
          ? 'Using Classic statistics from the Exalted First Edition core rules.'
          : "Using Power Combat statistics from the Exalted Player's Guide. Profiles are kept separate."}
      </p>

      <div className="exalted-combat-summary">
        <article>
          <span>Initiative</span>
          <strong>{initiative}</strong>
          <small>Dexterity + Wits + modifiers</small>
        </article>
        <article>
          <span>Dodge pool</span>
          <strong>{dodge}</strong>
          <small>Dexterity + Dodge + mobility</small>
        </article>
        <article>
          <span>Soak</span>
          <strong>
            {protection.finalLethal}L / {protection.finalBashing}B
          </strong>
          <small>Natural + equipped armor</small>
        </article>
        <article>
          <span>Mobility</span>
          <strong>{signed(protection.mobilityPenalty)}</strong>
          <small>Fatigue {protection.fatigue}</small>
        </article>
        <label>
          <span>Wound penalty</span>
          <select
            value={character.combat.woundPenalty}
            onChange={(event) =>
              onCombatChange({
                ...character.combat,
                woundPenalty: Number(event.target.value),
              })
            }
          >
            {[0, -1, -2, -3, -4].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="exalted-specialties">
        <h3>Combat specialties</h3>
        <div className="exalted-specialty-add">
          <label>
            <span>Ability</span>
            <select
              value={specialtyAbility}
              onChange={(event) =>
                setSpecialtyAbility(event.target.value as ExaltedAbilityId)
              }
            >
              {['archery', 'brawl', 'martialArts', 'melee', 'thrown'].map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            <span>Specialty</span>
            <input
              value={specialtyLabel}
              onChange={(event) => setSpecialtyLabel(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary-button"
            disabled={!specialtyLabel.trim()}
            onClick={() => {
              onCombatChange({
                ...character.combat,
                specialties: [
                  ...character.combat.specialties,
                  {
                    id: crypto.randomUUID(),
                    abilityId: specialtyAbility,
                    label: specialtyLabel.trim(),
                    rating: 1,
                  },
                ],
              });
              setSpecialtyLabel('');
            }}
          >
            Add specialty
          </button>
        </div>
        {character.combat.specialties.map((specialty) => (
          <div className="exalted-specialty-row" key={specialty.id}>
            <span>
              {specialty.label} ({specialty.abilityId}) +{specialty.rating}
            </span>
            <button
              type="button"
              className="small-button small-button--quiet"
              onClick={() =>
                onCombatChange({
                  ...character.combat,
                  specialties: character.combat.specialties.filter(
                    ({ id }) => id !== specialty.id,
                  ),
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <h3>Attacks</h3>
      <div className="exalted-attack-list">
        {attacks.map((attack) => (
          <article key={attack.equipmentId}>
            <div className="exalted-attack-heading">
              <div>
                <p className="eyebrow">{attack.abilityId}</p>
                <h4>{attack.name}</h4>
              </div>
              <strong>Pool {attack.attackPool}</strong>
            </div>
            <dl className="exalted-stat-line">
              <div>
                <dt>Speed</dt>
                <dd>{signed(attack.speed)}</dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd>{signed(attack.accuracy)}</dd>
              </div>
              <div>
                <dt>Damage</dt>
                <dd>
                  {attack.damageTotal}
                  {damageType(attack.damage.type)}
                </dd>
              </div>
              <div>
                <dt>Defense</dt>
                <dd>{signed(attack.defense)}</dd>
              </div>
              <div>
                <dt>Rate</dt>
                <dd>{attack.rate}</dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>{attack.range ?? '—'}</dd>
              </div>
            </dl>
            <details>
              <summary>Calculation, powers, and source</summary>
              <dl className="exalted-breakdown">
                {attack.attackBreakdown.map((line) => (
                  <div key={line.label}>
                    <dt>{line.label}</dt>
                    <dd>{signed(line.value)}</dd>
                  </div>
                ))}
              </dl>
              {attack.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
              {(() => {
                const relevantCharmIds = character.powers.charms
                  .filter(({ definitionId }) => {
                    const definition = dragonBloodedCharmById.get(definitionId);
                    return (
                      definition?.ability
                        .replace(/\s+/g, '')
                        .toLocaleLowerCase() ===
                      attack.abilityId.toLocaleLowerCase()
                    );
                  })
                  .map(({ definitionId }) => definitionId);
                const relevantCombos = character.combos.filter(({ charmIds }) =>
                  charmIds.some((id) => relevantCharmIds.includes(id)),
                );
                if (!relevantCharmIds.length && !relevantCombos.length)
                  return null;
                return (
                  <div>
                    <h5>Relevant powers</h5>
                    {relevantCharmIds.length ? (
                      <p>
                        {relevantCharmIds
                          .map((id) => dragonBloodedCharmById.get(id)?.name)
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    ) : null}
                    {relevantCombos.length ? (
                      <p>
                        Combos:{' '}
                        {relevantCombos.map(({ name }) => name).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                );
              })()}
              <p>
                {attack.source.book}, p. {attack.source.page}
              </p>
            </details>
          </article>
        ))}
      </div>

      <h3>Protection</h3>
      <article className="sheet-card exalted-protection-card">
        <p>
          <strong>
            {protection.finalLethal} lethal / {protection.finalBashing} bashing
            soak
          </strong>
        </p>
        <ul>
          {protection.breakdown.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {character.equipment.shields.some(({ equipped }) => equipped) ? (
          <p>
            Equipped shield effects are retained as equipment notes; no
            unsourced shield modifiers are applied automatically.
          </p>
        ) : null}
      </article>
    </div>
  );
}
