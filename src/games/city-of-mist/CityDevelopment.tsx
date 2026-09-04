import { useState } from 'react';
import { TextField } from '../shared/LocalSheet';
import type { CityCharacter } from './schema';
import { newTheme } from './ThemeCards';
import { cityThemeCatalog } from './catalog';
import { citySources } from './sources';
import { catalogAvailability } from '../shared/catalog-sources';
import {
  markCityAttention,
  markCityStrain,
  claimCityImprovement,
  quoteCityReplacement,
  replaceCityTheme,
} from './development';

export function CityDevelopment({
  character: c,
  onChange,
}: {
  character: CityCharacter;
  onChange: (c: CityCharacter) => void;
}) {
  const active = c.themes.filter(
    (t) =>
      t.state !== 'archived' && ['logos', 'mythos', 'mist'].includes(t.kind),
  );
  const [id, setId] = useState(''),
    [reason, setReason] = useState(''),
    [power, setPower] = useState(''),
    [question, setQuestion] = useState(''),
    [error, setError] = useState(''),
    [approved, setApproved] = useState(false);
  const [promotion, setPromotion] = useState(false),
    [sudden, setSudden] = useState(false),
    [book, setBook] = useState(''),
    [statement, setStatement] = useState(''),
    [weakness, setWeakness] = useState(''),
    [weakQuestion, setWeakQuestion] = useState(''),
    [nemesis, setNemesis] = useState('');
  const theme = active.find((t) => t.id === id) ?? active[0];
  const quote = theme ? quoteCityReplacement(c, theme.id, promotion) : null;
  const books = cityThemeCatalog.filter(
    (entry) =>
      entry.kind === quote?.nextKind &&
      catalogAvailability(entry.sourceId, c.enabledSources, citySources) ===
        'available',
  );
  const selected = books.find(({ name }) => name === book) ?? books[0];
  const perform = (action: () => CityCharacter, message: string) => {
    if (!approved || !reason.trim() || !window.confirm(message)) return;
    try {
      onChange(action());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply development.');
    }
  };
  return (
    <details>
      <summary>Theme development and replacement</summary>
      <p>
        Player’s Guide pp. 245–267; Gatekeepers: Shadows & Showdowns pp.
        252–255. These actions apply reviewed changes and retain the old theme
        in history. Narrative triggers are decided by the table.
      </p>
      <p>
        Pending Moments of Evolution: {c.development.pendingMoments}.
        Transition: {c.development.state}. Choosing and applying Moment benefits
        is still a manual, source-reviewed step.
      </p>
      {c.development.state !== 'normal' && (
        <p role="status">
          {c.development.state}: review the special character-state rules with
          the MC. This panel records the transition but does not automate all
          Sleeper, Avatar or Bigwig abilities.
        </p>
      )}
      {!theme ? (
        <p>Add an active character theme before recording development.</p>
      ) : (
        <>
          <label>
            Development theme
            <select value={theme.id} onChange={(e) => setId(e.target.value)}>
              {active.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            {theme.name}: Attention {theme.attention}/3 · {theme.strainKind}{' '}
            {theme.strain}/3 · {theme.state}
          </p>
          <TextField
            label="Development trigger and table ruling"
            value={reason}
            onChange={setReason}
          />
          <label>
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            The table confirmed the trigger and any chosen source questions
          </label>
          <TextField
            label="New development power tag"
            value={power}
            onChange={setPower}
          />
          <TextField
            label="Power question letter"
            value={question}
            onChange={setQuestion}
          />
          <p>
            Nascent themes need a new power tag on their first Attention mark
            and when first filling the track. Other Attention marks do not add a
            tag.
          </p>
          <button
            disabled={!approved || !reason.trim() || theme.attention >= 3}
            onClick={() =>
              perform(
                () =>
                  markCityAttention(c, theme.id, reason, {
                    name: power,
                    questionId: question,
                  }),
                'Mark Attention and apply any required nascent power tag?',
              )
            }
          >
            Confirm Attention
          </button>
          <button
            disabled={!approved || !reason.trim() || theme.attention !== 3}
            onClick={() =>
              perform(
                () =>
                  claimCityImprovement(c, theme.id, 'power', reason, {
                    name: power,
                    questionId: question,
                  }),
                'Reset Attention and add the reviewed power tag?',
              )
            }
          >
            Spend Attention on power tag
          </button>
          <button
            disabled={!approved || !reason.trim() || theme.attention !== 3}
            onClick={() =>
              perform(
                () => claimCityImprovement(c, theme.id, 'stabilize', reason),
                'Reset Attention and clear this theme’s Fade, Crack or Strikes?',
              )
            }
          >
            Spend Attention to stabilize theme
          </button>
          <button
            disabled={!approved || !reason.trim() || theme.strain >= 3}
            onClick={() =>
              perform(
                () => markCityStrain(c, theme.id, 1, reason),
                'Mark one point of theme strain? At three, review replacement; nothing is removed automatically.',
              )
            }
          >
            Mark {theme.strainKind}
          </button>
          {theme.kind === 'mist' && (
            <button
              disabled={!approved || !reason.trim() || theme.strain >= 3}
              onClick={() =>
                perform(
                  () => markCityStrain(c, theme.id, 2, reason),
                  'Record the superior’s ruling of an especially severe transgression and mark two Strikes?',
                )
              }
            >
              Record severe Performance Review
            </button>
          )}
          <details>
            <summary>Replace theme — preview first</summary>
            {c.profile === 'gatekeeper' && theme.kind === 'logos' && (
              <label>
                <input
                  type="checkbox"
                  checked={promotion}
                  onChange={(e) => setPromotion(e.target.checked)}
                />
                The narrative and superiors support a promotion (otherwise this
                is personal business)
              </label>
            )}
            <label>
              <input
                type="checkbox"
                checked={sudden}
                onChange={(e) => setSudden(e.target.checked)}
              />
              A reviewed move requires sudden replacement before three strain
              marks
            </label>
            <p>
              Archive {theme.name}; gain {quote!.buildUp} Build-Up. New balance:{' '}
              {quote!.remainder}/5, plus {quote!.moments} pending Moment(s).{' '}
              {quote!.nextKind
                ? `Introduce a nascent ${quote!.nextKind} theme.`
                : `Transition to ${quote!.state}; no immediate replacement theme.`}
            </p>
            <TextField
              label="New Nemesis or pending MC reveal"
              value={nemesis}
              onChange={setNemesis}
            />
            {quote!.nextKind && (
              <>
                <label>
                  Nascent themebook
                  <select
                    value={selected?.name ?? ''}
                    onChange={(e) => setBook(e.target.value)}
                  >
                    {books.map(({ name }) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <p>
                  Use the power tag above to answer question A.{' '}
                  {selected &&
                    `Source: ${citySources.find((s) => s.id === selected.sourceId)?.title}, p. ${selected.page}.`}
                </p>
                <TextField
                  label="Nascent Mystery, Identity or Directive"
                  value={statement}
                  onChange={setStatement}
                />
                <TextField
                  label="Nascent weakness tag"
                  value={weakness}
                  onChange={setWeakness}
                />
                <TextField
                  label="Nascent weakness question"
                  value={weakQuestion}
                  onChange={setWeakQuestion}
                />
              </>
            )}
            <button
              disabled={
                !approved || !reason.trim() || (!sudden && theme.strain < 3)
              }
              onClick={() =>
                perform(() => {
                  const replacement =
                    quote!.nextKind && selected
                      ? {
                          ...newTheme(selected.name, quote!.nextKind),
                          state: 'nascent' as const,
                          statement,
                          tags: [
                            {
                              id: crypto.randomUUID(),
                              name: power,
                              questionId: question,
                              kind: 'power' as const,
                              broad: false,
                              burnt: false,
                            },
                            {
                              id: crypto.randomUUID(),
                              name: weakness,
                              questionId: weakQuestion,
                              kind: 'weakness' as const,
                              broad: false,
                              burnt: false,
                            },
                          ],
                        }
                      : null;
                  return replaceCityTheme(
                    c,
                    theme.id,
                    replacement,
                    promotion,
                    reason,
                    sudden,
                    nemesis,
                  );
                }, 'Apply the displayed replacement? The old theme will be archived, never deleted. Its tags and improvements cease to be active.')
              }
            >
              Confirm theme replacement
            </button>
          </details>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <details>
        <summary>Development history ({c.development.history.length})</summary>
        {[...c.development.history].reverse().map((e) => (
          <p key={e.id}>
            {e.date.slice(0, 10)} · {e.before.name} →{' '}
            {e.after?.name ?? 'special transition'} · {e.reason}
          </p>
        ))}
      </details>
    </details>
  );
}
