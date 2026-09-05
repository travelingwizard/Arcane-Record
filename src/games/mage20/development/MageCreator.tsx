import { useState } from 'react';
import { TraitChoiceFields } from '../supplements/TraitChoiceFields';
import {
  useMageSourceFilter,
  MageSourceWarning,
} from '../supplements/SourceControls';
import { useEditorStore } from '../../../state/editor-store';
import { DotRating } from '../../../components/controls/DotRating';
import {
  backgroundCatalog,
  backgroundById,
  formatBackgroundSources,
} from '../../../systems/mage-m20/reference/backgrounds';
import {
  meritFlawCatalog,
  meritFlawById,
} from '../../../systems/mage-m20/reference/merits-flaws';
import { focusCatalogs } from '../../../systems/mage-m20/reference/focus';
import { spheres } from '../../../systems/mage-m20/definitions';
import {
  backgroundCost,
  createdRating,
  creationIssues,
  creationPreview,
  developmentFor,
  finalizeCreation,
  freebieCost,
  mageTraits,
  sectAffinities,
  standardBudgets,
  startingRating,
} from './rules';
import type { MageCreationDraft } from './schema';
import { MageAbilityDetails } from './MageAbilityDetails';

const steps = [
  'Profile',
  'Identity',
  'Attributes',
  'Abilities',
  'Backgrounds',
  'Focus',
  'Magick',
  'Freebies',
  'Finishing details',
  'Review',
];
const hints = [
  'Build a newly Awakened mage, add a GM-granted XP award for an experienced character, or define clearly labeled house rules.',
  'Concept describes who you are. Nature is your inner drive; Demeanor is the face you show others. Essence describes your Avatar’s inclination.',
  'Every Attribute starts at one. Assign category priorities, then spend additional dots in each category.',
  'Abilities start at zero. Initial dots cannot take an Ability above three; later freebie purchases can raise it further.',
  'Backgrounds represent connections, resources and supernatural advantages. Some cost two points per dot. Extra points beyond the initial pool cost freebies.',
  'Focus combines belief, method and tools. Choose at least one paradigm, one practice and seven instruments; custom descriptions remain yours.',
  'Six initial dots include the first dot in your affinity Sphere. Sphere ratings cannot exceed Arete; extra Arete uses freebies.',
  'Keep freebie purchases distinct from initial allocation. Up to seven Flaw points add to the budget. Quintessence is purchased in bundles of four.',
  'Describe Awakening, Avatar and everyday life. Possessions and Wonders are managed on the normal sheet; magical equipment needs appropriate Background support.',
  'Review every exception and proposed change. Confirmation applies this draft; later advancement and play state remain intact on rebuild.',
];
const pages = [250, 254, 255, 255, 256, 256, 257, 253, 259, 250];

export function MageCreator() {
  const c = useEditorStore((s) => s.character)!;
  const update = useEditorStore((s) => s.updateMage);
  const sourceFilter = useMageSourceFilter();
  const [search, setSearch] = useState('');
  const [focusKind, setFocusKind] = useState<
    'paradigm' | 'practice' | 'instrument'
  >('paradigm');
  const [customFocus, setCustomFocus] = useState('');
  const [traitCost, setTraitCost] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const dev = developmentFor(c),
    d = dev.draft;
  if (!d) return null;
  const patch = (fn: (value: MageCreationDraft) => MageCreationDraft) => {
    setReview(false);
    update((current) => {
      const development = developmentFor(current);
      return {
        ...current,
        development: { ...development, draft: fn(development.draft!) },
      };
    });
  };
  const traits = mageTraits(c).filter((t) => t.kind !== 'background');
  const issues = creationIssues(c, d);
  const remaining =
    d.budgets.freebies +
    Math.min(
      7,
      d.flaws.reduce((n, f) => n + f.chosenCost, 0),
    ) -
    freebieCost(d, traits);
  const matches = (name: string) =>
    name.toLowerCase().includes(search.toLowerCase());
  const source = (
    <>
      {sourceFilter.controls}
      <p className="section-note">
        Mage 20, p. {pages[d.step]} · Saved draft; not yet applied to the sheet.
      </p>
    </>
  );
  const setAmount = (key: string, value: number, pool: 'base' | 'freebies') =>
    patch((v) => ({ ...v, [pool]: { ...v[pool], [key]: value } }));
  const approve = (code: string, checked: boolean) =>
    patch((v) => {
      const approvals = { ...v.approvals };
      if (checked)
        approvals[code] = {
          reason:
            issues.find((i) => i.code === code)?.message ??
            'GM approved this choice.',
          at: new Date().toISOString(),
        };
      else delete approvals[code];
      return { ...v, approvals };
    });
  const priorities = (kind: 'attribute' | 'ability') => {
    const key =
      kind === 'attribute' ? 'attributePriorities' : 'abilityPriorities';
    const options =
      kind === 'attribute'
        ? ['physical', 'social', 'mental']
        : ['talents', 'skills', 'knowledges'];
    return (
      <div className="mage-creator-grid">
        {d[key].map((group, index) => (
          <label key={index}>
            <span>
              {['Primary', 'Secondary', 'Tertiary'][index]} {kind} category
            </span>
            <select
              value={group}
              onChange={(e) =>
                patch((v) => {
                  const list = [...v[key]];
                  const other = list.indexOf(e.target.value as never);
                  if (other >= 0) list[other] = list[index];
                  list[index] = e.target.value as never;
                  return { ...v, [key]: list };
                })
              }
            >
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  };
  const ratingRows = (
    kind: 'attribute' | 'ability' | 'sphere',
    pool: 'base' | 'freebies' = 'base',
  ) => (
    <div className="mage-creator-grid">
      {traits
        .filter((t) => t.kind === kind)
        .map((t) => (
          <div className="mage-creator-rating" key={t.key}>
            <strong>{t.label}</strong>
            <small>
              {t.group} · resulting rating {createdRating(d, t)}
            </small>
            <DotRating
              label={`${t.label} ${pool === 'base' ? 'initial dots' : 'freebie dots'}`}
              value={d[pool][t.key] ?? 0}
              max={kind === 'attribute' ? 4 : 5}
              min={0}
              onChange={(value) => setAmount(t.key, value, pool)}
            />
          </div>
        ))}
    </div>
  );
  const focusKey =
    focusKind === 'paradigm'
      ? 'paradigms'
      : focusKind === 'practice'
        ? 'practices'
        : 'instruments';
  return (
    <section
      className="mage-creator character-creator"
      aria-label="Mage character creator"
    >
      <h2>Build your Mage</h2>
      <nav aria-label="Mage creation steps" className="mage-creator-steps">
        {steps.map((name, i) => (
          <button
            key={name}
            className="secondary-button"
            aria-current={d.step === i ? 'step' : undefined}
            onClick={() => patch((v) => ({ ...v, step: i }))}
          >
            {i + 1}. {name}
          </button>
        ))}
      </nav>
      <h3>{steps[d.step]}</h3>
      <p>{hints[d.step]}</p>
      {source}
      <p role="status">
        Freebies remaining: {remaining} ·{' '}
        {issues.filter((i) => !d.approvals[i.code]).length} unresolved
        requirements
      </p>
      {d.step === 0 && (
        <>
          <label>
            <span>Creation profile</span>
            <select
              value={d.profile}
              onChange={(e) =>
                patch((v) => ({
                  ...v,
                  profile: e.target.value as MageCreationDraft['profile'],
                  budgets: structuredClone(standardBudgets),
                }))
              }
            >
              <option value="standard">Standard Awakened mage</option>
              <option value="experienced">Experienced mage</option>
              <option value="custom">Custom house-rule profile</option>
            </select>
          </label>
          <p>
            Sorcerer and non-Awakened operative profiles:{' '}
            <strong>Preview — unavailable</strong>. Complete player-creation
            sources are required; NPC examples are not creation rules.
          </p>
          {d.profile === 'experienced' && (
            <>
              <label>
                <span>Starting XP award</span>
                <input
                  type="number"
                  min="0"
                  value={d.startingXp}
                  onChange={(e) =>
                    patch((v) => ({
                      ...v,
                      startingXp: Math.max(
                        0,
                        Math.trunc(Number(e.target.value)),
                      ),
                    }))
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!d.approvals['starting-xp']}
                  onChange={(e) => approve('starting-xp', e.target.checked)}
                />
                GM Approved starting XP
              </label>
            </>
          )}
          {d.profile === 'custom' && (
            <>
              <p>House rules, not official starting values.</p>
              <div className="mage-creator-grid">
                {(
                  ['backgrounds', 'spheres', 'freebies', 'areteCap'] as const
                ).map((key) => (
                  <label key={key}>
                    <span>Custom {key}</span>
                    <input
                      type="number"
                      min={key === 'areteCap' ? 1 : 0}
                      max={key === 'areteCap' ? 10 : 10000}
                      value={d.budgets[key]}
                      onChange={(e) =>
                        patch((v) => ({
                          ...v,
                          budgets: {
                            ...v.budgets,
                            [key]: Math.max(
                              key === 'areteCap' ? 1 : 0,
                              Math.min(
                                key === 'areteCap' ? 10 : 10000,
                                Math.trunc(Number(e.target.value)),
                              ),
                            ),
                          },
                        }))
                      }
                    />
                  </label>
                ))}
                {(['attributes', 'abilities'] as const).flatMap((key) =>
                  d.budgets[key].map((value, i) => (
                    <label key={`${key}${i}`}>
                      <span>
                        Custom {key} priority {i + 1}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={value}
                        onChange={(e) =>
                          patch((v) => ({
                            ...v,
                            budgets: {
                              ...v.budgets,
                              [key]: v.budgets[key].map((n, j) =>
                                i === j
                                  ? Math.max(
                                      0,
                                      Math.trunc(Number(e.target.value)),
                                    )
                                  : n,
                              ),
                            },
                          }))
                        }
                      />
                    </label>
                  )),
                )}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={!!d.approvals['custom-profile']}
                  onChange={(e) => approve('custom-profile', e.target.checked)}
                />
                GM Approved custom profile
              </label>
            </>
          )}
        </>
      )}
      {d.step === 1 && (
        <div className="mage-creator-grid">
          {Object.keys(c.identity).map((key) => (
            <label key={key}>
              <span>Creator {key}</span>
              {key === 'affiliation' ? (
                <select
                  value={d.identity[key] ?? ''}
                  onChange={(e) =>
                    patch((v) => ({
                      ...v,
                      identity: { ...v.identity, [key]: e.target.value },
                    }))
                  }
                >
                  <option value="">Choose affiliation</option>
                  {['Traditions', 'Technocracy', 'Disparates', 'Orphan'].map(
                    (a) => (
                      <option key={a}>{a}</option>
                    ),
                  )}
                </select>
              ) : (
                <input
                  list={key === 'sect' ? 'mage-sects' : undefined}
                  value={d.identity[key] ?? ''}
                  onChange={(e) =>
                    patch((v) => ({
                      ...v,
                      identity: { ...v.identity, [key]: e.target.value },
                    }))
                  }
                />
              )}
            </label>
          ))}
          <datalist id="mage-sects">
            {Object.keys(sectAffinities).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </datalist>
        </div>
      )}
      {d.step === 2 && (
        <>
          {priorities('attribute')}
          {d.attributePriorities.map((g, i) => (
            <p key={g}>
              {g}:{' '}
              {traits
                .filter((t) => t.kind === 'attribute' && t.group === g)
                .reduce((n, t) => n + (d.base[t.key] ?? 0), 0)}{' '}
              / {d.budgets.attributes[i]} initial dots
            </p>
          ))}
          {ratingRows('attribute')}
        </>
      )}
      {d.step === 3 && (
        <>
          {priorities('ability')}
          {d.abilityPriorities.map((g, i) => (
            <p key={g}>
              {g}:{' '}
              {traits
                .filter((t) => t.kind === 'ability' && t.group === g)
                .reduce((n, t) => n + (d.base[t.key] ?? 0), 0)}{' '}
              / {d.budgets.abilities[i]} initial dots
            </p>
          ))}
          {ratingRows('ability')}
          <MageAbilityDetails />
        </>
      )}
      {d.step === 4 && (
        <>
          <p>
            Background points: {backgroundCost(d)} / {d.budgets.backgrounds};
            excess is charged to freebies.
          </p>
          {d.backgrounds.map((b) => (
            <div className="mage-creator-rating" key={b.id}>
              <strong>
                {backgroundById.get(b.definitionId)?.name ?? b.definitionId}
              </strong>
              <DotRating
                label={`${b.definitionId} creation rating`}
                value={b.rating}
                min={1}
                max={5}
                onChange={(rating) =>
                  patch((v) => ({
                    ...v,
                    backgrounds: v.backgrounds.map((e) =>
                      e.id === b.id ? { ...e, rating } : e,
                    ),
                  }))
                }
              />
              <button
                onClick={() =>
                  patch((v) => ({
                    ...v,
                    backgrounds: v.backgrounds.filter((e) => e.id !== b.id),
                  }))
                }
              >
                Remove Background
              </button>
            </div>
          ))}
          <label>
            <span>Search Backgrounds</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="mage-catalog-results">
            {backgroundCatalog
              .filter((b) => matches(b.name) && sourceFilter.visible(b))
              .map((b) => (
                <article key={b.id}>
                  <h4>
                    {b.name} · {b.creationPointCostPerDot} point(s) per dot
                  </h4>
                  <p>{b.description}</p>
                  <small>{formatBackgroundSources(b)}</small>
                  <MageSourceWarning entry={b} />
                  <button
                    disabled={
                      !sourceFilter.available(b) ||
                      (!b.canBeSelectedMultipleTimes &&
                        d.backgrounds.some((e) => e.definitionId === b.id))
                    }
                    onClick={() =>
                      patch((v) => ({
                        ...v,
                        backgrounds: [
                          ...v.backgrounds,
                          {
                            id: crypto.randomUUID(),
                            definitionId: b.id,
                            displayName: '',
                            rating: 1,
                            notes: '',
                            addedAt: new Date().toISOString(),
                            pooled: false,
                          },
                        ],
                      }))
                    }
                  >
                    Add {b.name}
                  </button>
                </article>
              ))}
          </div>
        </>
      )}
      {d.step === 5 && (
        <>
          <label>
            <span>Focus category</span>
            <select
              value={focusKind}
              onChange={(e) => {
                setFocusKind(e.target.value as typeof focusKind);
                setSearch('');
              }}
            >
              <option value="paradigm">Paradigms</option>
              <option value="practice">Practices</option>
              <option value="instrument">Instruments</option>
            </select>
          </label>
          <p>
            Selected: {d.focus.paradigms.length} paradigms ·{' '}
            {d.focus.practices.length} practices · {d.focus.instruments.length}{' '}
            instruments
          </p>
          <ul>
            {d.focus[focusKey].map((f) => (
              <li key={f.id}>
                {f.customName ??
                  focusCatalogs[focusKind].find((e) => e.id === f.definitionId)
                    ?.name}
                <button
                  onClick={() =>
                    patch((v) => ({
                      ...v,
                      focus: {
                        ...v.focus,
                        [focusKey]: v.focus[focusKey].filter(
                          (e) => e.id !== f.id,
                        ),
                      },
                    }))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <label>
            <span>Custom {focusKind}</span>
            <input
              value={customFocus}
              onChange={(e) => setCustomFocus(e.target.value)}
            />
          </label>
          <button
            disabled={!customFocus.trim()}
            onClick={() => {
              patch((v) => ({
                ...v,
                focus: {
                  ...v.focus,
                  [focusKey]: [
                    ...v.focus[focusKey],
                    {
                      id: crypto.randomUUID(),
                      customName: customFocus.trim(),
                      notes: '',
                      addedAt: new Date().toISOString(),
                      significant: false,
                    },
                  ],
                },
              }));
              setCustomFocus('');
            }}
          >
            Add custom {focusKind}
          </button>
          <label>
            <span>Search Focus</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="mage-catalog-results">
            {focusCatalogs[focusKind]
              .filter((f) => matches(f.name) && sourceFilter.visible(f))
              .map((f) => (
                <article key={f.id}>
                  <h4>{f.name}</h4>
                  <p>{f.summary}</p>
                  <MageSourceWarning entry={f} />
                  <small>
                    {f.citation} · {f.reviewStatus}
                  </small>
                  <button
                    disabled={
                      !sourceFilter.available(f) ||
                      d.focus[focusKey].some((e) => e.definitionId === f.id)
                    }
                    onClick={() =>
                      patch((v) => ({
                        ...v,
                        focus: {
                          ...v.focus,
                          [focusKey]: [
                            ...v.focus[focusKey],
                            {
                              id: crypto.randomUUID(),
                              definitionId: f.id,
                              notes: '',
                              addedAt: new Date().toISOString(),
                              significant: false,
                            },
                          ],
                        },
                      }))
                    }
                  >
                    Add {f.name}
                  </button>
                </article>
              ))}
          </div>
        </>
      )}
      {d.step === 6 && (
        <>
          <label>
            <span>Creator affinity Sphere</span>
            <select
              value={d.affinity ?? ''}
              onChange={(e) =>
                patch((v) => ({ ...v, affinity: e.target.value || null }))
              }
            >
              <option value="">Choose affinity</option>
              {spheres.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <p>
            Group Spheres:{' '}
            {(sectAffinities[d.identity.sect] ?? []).join(', ') ||
              'Confirm with the Storyteller.'}
          </p>
          <label>
            <span>Additional Arete dots (4 freebies each)</span>
            <input
              type="number"
              min="0"
              max="9"
              value={d.freebies['enlightenment.arete'] ?? 0}
              onChange={(e) =>
                setAmount(
                  'enlightenment.arete',
                  Math.max(0, Math.min(9, Number(e.target.value))),
                  'freebies',
                )
              }
            />
          </label>
          {ratingRows('sphere')}
        </>
      )}
      {d.step === 7 && (
        <>
          <div className="mage-creator-grid">
            {traits.map((t) => (
              <label key={t.key}>
                <span>
                  {t.label} freebie dots · final {createdRating(d, t)}
                </span>
                <input
                  type="number"
                  min="0"
                  max={t.max - startingRating(t)}
                  value={d.freebies[t.key] ?? 0}
                  onChange={(e) =>
                    setAmount(
                      t.key,
                      Math.max(
                        0,
                        Math.min(
                          t.max - startingRating(t),
                          Math.trunc(Number(e.target.value)),
                        ),
                      ),
                      'freebies',
                    )
                  }
                />
              </label>
            ))}
            <label>
              <span>Quintessence bundles (4 dots / 1 freebie)</span>
              <input
                type="number"
                min="0"
                max="5"
                value={d.freebies.quintessence ?? 0}
                onChange={(e) =>
                  setAmount(
                    'quintessence',
                    Math.max(0, Math.min(5, Number(e.target.value))),
                    'freebies',
                  )
                }
              />
            </label>
          </div>
          <h4>Merits and Flaws (optional)</h4>
          <ul>
            {[...d.merits, ...d.flaws].map((m) => (
              <li key={m.id}>
                {meritFlawById.get(m.definitionId)?.name ?? m.definitionId} ·{' '}
                {m.chosenCost}
                <TraitChoiceFields
                  definitionId={m.definitionId}
                  choice={m.choice}
                  onChange={(choice) =>
                    patch((v) => ({
                      ...v,
                      merits: v.merits.map((e) =>
                        e.id === m.id ? { ...e, choice } : e,
                      ),
                      flaws: v.flaws.map((e) =>
                        e.id === m.id ? { ...e, choice } : e,
                      ),
                    }))
                  }
                />
                <button
                  onClick={() =>
                    patch((v) => ({
                      ...v,
                      merits: v.merits.filter((e) => e.id !== m.id),
                      flaws: v.flaws.filter((e) => e.id !== m.id),
                    }))
                  }
                >
                  Remove Trait
                </button>
              </li>
            ))}
          </ul>
          <label>
            <span>Search Merits and Flaws</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="mage-catalog-results">
            {meritFlawCatalog
              .filter((m) => matches(m.name) && sourceFilter.visible(m))
              .map((m) => (
                <article key={m.id}>
                  <h4>
                    {m.name} · {m.kind}
                  </h4>
                  <details>
                    <summary>Rules and source</summary>
                    <p>{m.description}</p>
                    <small>
                      {m.sources
                        .map((s) => `${s.bookLabel}, p. ${s.page}`)
                        .join('; ')}
                    </small>
                  </details>
                  <MageSourceWarning entry={m} />
                  <label>
                    <span>{m.name} cost</span>
                    <select
                      value={traitCost[m.id] ?? ''}
                      onChange={(e) =>
                        setTraitCost((v) => ({
                          ...v,
                          [m.id]: Number(e.target.value),
                        }))
                      }
                    >
                      <option value="">Choose legal cost</option>
                      {m.allowedCosts.map((cost) => (
                        <option key={cost} value={cost}>
                          {cost}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    disabled={
                      !m.playerSelectable ||
                      !sourceFilter.available(m) ||
                      !m.allowedCosts.includes(traitCost[m.id]) ||
                      [...d.merits, ...d.flaws].some(
                        (e) => e.definitionId === m.id,
                      )
                    }
                    onClick={() =>
                      patch((v) => ({
                        ...v,
                        [m.kind === 'merit' ? 'merits' : 'flaws']: [
                          ...v[m.kind === 'merit' ? 'merits' : 'flaws'],
                          {
                            id: crypto.randomUUID(),
                            definitionId: m.id,
                            chosenCost: traitCost[m.id],
                            notes: '',
                            addedAt: new Date().toISOString(),
                          },
                        ],
                      }))
                    }
                  >
                    Add {m.name}
                  </button>
                </article>
              ))}
          </div>
        </>
      )}
      {d.step === 8 && (
        <div className="mage-creator-grid">
          {[
            'motivation',
            'appearance',
            'awakening',
            'avatar',
            'history',
            'possessions',
          ].map((key) => (
            <label key={key}>
              <span>Creator {key}</span>
              <textarea
                value={d.details[key] ?? ''}
                onChange={(e) =>
                  patch((v) => ({
                    ...v,
                    details: { ...v.details, [key]: e.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      )}
      {d.step === 9 && (
        <>
          <h4>Validation and approvals</h4>
          {issues.length === 0 && (
            <p>All creation budgets and requirements are satisfied.</p>
          )}
          {issues.map((i) => (
            <div className="notice" key={i.code}>
              <p>
                {i.message} <small>M20, p. {i.page}</small>
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={!!d.approvals[i.code]}
                  onChange={(e) => approve(i.code, e.target.checked)}
                />
                GM Approved: {i.message}
              </label>
              {d.approvals[i.code] && (
                <label>
                  <span>Approval reason</span>
                  <input
                    value={d.approvals[i.code].reason}
                    onChange={(e) =>
                      patch((v) => ({
                        ...v,
                        approvals: {
                          ...v.approvals,
                          [i.code]: {
                            ...v.approvals[i.code],
                            reason: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </label>
              )}
            </div>
          ))}
          <button className="secondary-button" onClick={() => setReview(true)}>
            Preview creation changes
          </button>
          {review && (
            <>
              <ul>
                {creationPreview(c, d).changes.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <button
                className="primary-button"
                disabled={issues.some(
                  (i) => !d.approvals[i.code]?.reason.trim(),
                )}
                onClick={() => {
                  try {
                    update(finalizeCreation);
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                Confirm and finalize Mage
              </button>
            </>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="button-row">
        <button
          disabled={d.step === 0}
          onClick={() => patch((v) => ({ ...v, step: v.step - 1 }))}
        >
          Previous step
        </button>
        <button
          disabled={d.step === 9}
          onClick={() => patch((v) => ({ ...v, step: v.step + 1 }))}
        >
          Next step
        </button>
      </div>
    </section>
  );
}
