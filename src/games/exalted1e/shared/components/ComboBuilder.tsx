import { useMemo, useState } from 'react';
import { dragonBloodedComboRules } from '../../dragon-blooded/combo-rules';
import {
  dragonBloodedCharmById,
  type DragonBloodedCharmDefinition,
} from '../../reference/dragonblooded-powers';
import { solarCharmById } from '../../reference/solar-charms';
import type { Exalted1eCharacter } from '../../schema';
import { analyzeCombo } from '../combos/engine';
import type { ExaltedCombo } from '../combos/types';

interface Props {
  character: Exalted1eCharacter;
  onChange: (combos: ExaltedCombo[]) => void;
}

function costLabel(analysis: ReturnType<typeof analyzeCombo>) {
  const cost = analysis.activationCost;
  const motes = cost.fixedMotes + cost.exaltTypeSurcharge;
  return `${motes} motes + ${cost.activationWillpower} Willpower${analysis.dynamicCosts ? ' + variable costs' : ''}`;
}

export function ComboBuilder({ character, onChange }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tacticalSummary, setTacticalSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [charmIds, setCharmIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [ability, setAbility] = useState('all');
  const [type, setType] = useState('all');

  const knownCharms = useMemo(() => {
    const definitions =
      character.sheetType === 'dragon-blooded'
        ? dragonBloodedCharmById
        : solarCharmById;
    return character.powers.charms
      .map(({ definitionId }) => definitions.get(definitionId))
      .filter((value): value is DragonBloodedCharmDefinition => Boolean(value));
  }, [character.powers.charms, character.sheetType]);
  const charmById =
    character.sheetType === 'dragon-blooded'
      ? dragonBloodedCharmById
      : solarCharmById;
  const selected = charmIds
    .map((id) => charmById.get(id))
    .filter((value): value is DragonBloodedCharmDefinition => Boolean(value));
  const analysis = analyzeCombo(
    character,
    selected,
    character.sheetType === 'dragon-blooded'
      ? dragonBloodedComboRules
      : undefined,
  );
  const available = knownCharms.filter((charm) => {
    if (charmIds.includes(charm.id)) return false;
    if (ability !== 'all' && charm.ability !== ability) return false;
    if (type !== 'all' && charm.type !== type) return false;
    const normalized = query.trim().toLocaleLowerCase();
    return (
      !normalized ||
      `${charm.name} ${charm.summary}`.toLocaleLowerCase().includes(normalized)
    );
  });
  const abilities = [
    ...new Set(knownCharms.map(({ ability: value }) => value)),
  ].sort();
  const types = [
    ...new Set(knownCharms.map(({ type: value }) => value).filter(Boolean)),
  ].sort();

  const move = (index: number, delta: number) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= charmIds.length) return;
    const next = [...charmIds];
    [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
    setCharmIds(next);
  };

  const save = () => {
    if (!name.trim() || !charmIds.length) return;
    onChange([
      ...character.combos,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        charmIds,
        description,
        tacticalSummary,
        notes,
        createdAt: new Date().toISOString(),
      },
    ]);
    setName('');
    setDescription('');
    setTacticalSummary('');
    setNotes('');
    setCharmIds([]);
  };

  return (
    <div className="exalted-combo-section">
      {character.sheetType === 'solar' ? (
        <p className="exalted-power-warning" role="status">
          Solar Charms are available for Combo records. The supplied handbook
          does not include complete Combo eligibility rules, so verify each
          combination against the cited source.
        </p>
      ) : null}
      <div className="exalted-combo-builder">
        <section aria-labelledby="known-charms-heading">
          <h3 id="known-charms-heading">Known Charms</h3>
          <label>
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            <span>Ability</span>
            <select
              value={ability}
              onChange={(event) => setAbility(event.target.value)}
            >
              <option value="all">All</option>
              {abilities.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="all">All</option>
              {types.map((value) => (
                <option key={value ?? ''}>{value}</option>
              ))}
            </select>
          </label>
          <div className="exalted-combo-charms">
            {available.map((charm) => (
              <article key={charm.id}>
                <div>
                  <strong>{charm.name}</strong>
                  <small>
                    {charm.ability} · {charm.type ?? 'Type unlisted'}
                  </small>
                </div>
                <button
                  type="button"
                  className="small-button"
                  onClick={() => setCharmIds((ids) => [...ids, charm.id])}
                >
                  Add
                </button>
              </article>
            ))}
          </div>
          {!knownCharms.length ? (
            <p className="empty-inline">
              Add Charms to the sheet before building a Combo.
            </p>
          ) : null}
        </section>

        <section aria-labelledby="combo-draft-heading">
          <h3 id="combo-draft-heading">Combo</h3>
          <label>
            <span>Combo name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="exalted-combo-selected">
            {selected.map((charm, index) => (
              <article key={charm.id}>
                <div>
                  <strong>{charm.name}</strong>
                  <small>
                    {charm.type ?? 'Type unlisted'} · {charm.ability}
                  </small>
                </div>
                <div>
                  <button
                    type="button"
                    className="small-button small-button--quiet"
                    disabled={index === 0}
                    aria-label={`Move ${charm.name} earlier`}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="small-button small-button--quiet"
                    disabled={index === selected.length - 1}
                    aria-label={`Move ${charm.name} later`}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="small-button small-button--quiet"
                    onClick={() =>
                      setCharmIds((ids) => ids.filter((id) => id !== charm.id))
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          <label>
            <span>Description / visual effect</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label>
            <span>Tactical purpose</span>
            <textarea
              value={tacticalSummary}
              onChange={(event) => setTacticalSummary(event.target.value)}
            />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="primary-button"
            disabled={!name.trim() || !charmIds.length}
            onClick={save}
          >
            Save Combo
          </button>
        </section>

        <aside
          aria-labelledby="combo-analysis-heading"
          className={
            analysis.valid
              ? 'exalted-combo-analysis is-valid'
              : 'exalted-combo-analysis is-invalid'
          }
        >
          <h3 id="combo-analysis-heading">Analysis</h3>
          <p>
            <strong>{analysis.valid ? '✓ Valid' : '✕ Invalid'}</strong>
          </p>
          <dl>
            <div>
              <dt>Activation</dt>
              <dd>{analysis.activationCost.activationWillpower} Willpower</dd>
            </div>
            <div>
              <dt>Fixed Essence</dt>
              <dd>{analysis.activationCost.fixedMotes} motes</dd>
            </div>
            <div>
              <dt>Elemental surcharge</dt>
              <dd>+{analysis.activationCost.exaltTypeSurcharge} motes</dd>
            </div>
            <div>
              <dt>Minimum</dt>
              <dd>{costLabel(analysis)}</dd>
            </div>
          </dl>
          {analysis.activationCost.variableMotes.map((message) => (
            <p className="exalted-combo-warning" key={message}>
              ⚠ {message}
            </p>
          ))}
          {analysis.activationCost.notes.map((message) => (
            <p key={message}>⚠ {message}</p>
          ))}
          {analysis.warnings.map((issue) => (
            <p
              className="exalted-combo-warning"
              key={`${issue.code}-${issue.message}`}
            >
              ⚠ {issue.message}
            </p>
          ))}
          {analysis.errors.map((issue) => (
            <p
              className="exalted-combo-error"
              key={`${issue.code}-${issue.message}`}
            >
              ✕ {issue.message}
            </p>
          ))}
          {selected
            .flatMap(({ comboRules }) => comboRules.specialRules)
            .map((rule) => (
              <p key={rule}>• {rule}</p>
            ))}
        </aside>
      </div>

      <h3>Saved Combos</h3>
      <div className="exalted-saved-combos">
        {character.combos.length ? (
          character.combos.map((combo) => {
            const charms = combo.charmIds
              .map((id) => dragonBloodedCharmById.get(id))
              .filter((value): value is DragonBloodedCharmDefinition =>
                Boolean(value),
              );
            const savedAnalysis = analyzeCombo(
              character,
              charms,
              character.sheetType === 'dragon-blooded'
                ? dragonBloodedComboRules
                : undefined,
            );
            return (
              <article key={combo.id}>
                <div className="exalted-equipment-card__heading">
                  <div>
                    <p className="eyebrow">
                      {savedAnalysis.valid ? 'Valid Combo' : 'Needs review'}
                    </p>
                    <h4>{combo.name}</h4>
                  </div>
                  <button
                    type="button"
                    className="small-button small-button--quiet"
                    onClick={() =>
                      onChange(
                        character.combos.filter(({ id }) => id !== combo.id),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
                <p>{combo.tacticalSummary || 'No tactical summary.'}</p>
                <p>
                  <strong>{costLabel(savedAnalysis)}</strong>
                </p>
                <details>
                  <summary>Components and rules</summary>
                  <ul>
                    {charms.map((charm) => (
                      <li key={charm.id}>
                        {charm.name} — {charm.type ?? 'Type unlisted'} —{' '}
                        {charm.cost ?? 'Cost unlisted'}
                      </li>
                    ))}
                  </ul>
                  {combo.description ? <p>{combo.description}</p> : null}
                  {combo.notes ? <p>{combo.notes}</p> : null}
                  {savedAnalysis.errors.map((issue) => (
                    <p className="exalted-combo-error" key={issue.message}>
                      {issue.message}
                    </p>
                  ))}
                </details>
              </article>
            );
          })
        ) : (
          <p className="empty-inline">No saved Combos.</p>
        )}
      </div>
    </div>
  );
}
