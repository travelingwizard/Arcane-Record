import { useState } from 'react';
import type { Exalted1eCharacter } from '../../schema';
import { exaltedLanguageById, exaltedLanguageCatalog } from './catalog';

interface Props {
  languages: Exalted1eCharacter['languages'];
  linguistics: number;
  onChange: (languages: Exalted1eCharacter['languages']) => void;
}

export function LanguagesSection({ languages, linguistics, onChange }: Props) {
  const [choice, setChoice] = useState('');
  const [customName, setCustomName] = useState('');
  const [proficiency, setProficiency] =
    useState<Exalted1eCharacter['languages'][number]['proficiency']>('fluent');
  const permanentCount = languages.filter(
    ({ proficiency }) => proficiency !== 'temporary',
  ).length;

  const addLanguage = () => {
    const custom = customName.trim();
    if (!choice && !custom) return;
    onChange([
      ...languages,
      {
        id: crypto.randomUUID(),
        definitionId: choice || null,
        customName: custom,
        proficiency,
        spoken: true,
        written: proficiency !== 'limited',
        notes: '',
        sourceType: proficiency === 'temporary' ? 'charm' : 'linguistics',
        sourceId: null,
      },
    ]);
    setChoice('');
    setCustomName('');
  };

  const groups = [
    ['native', 'Native Language'],
    ['known', 'Known Languages'],
    ['temporary', 'Temporary Languages'],
  ] as const;

  return (
    <>
      <p className="section-note">
        Linguistics {linguistics}. Permanent languages remain separate from
        temporary languages granted by Charms, spells, or rituals.
      </p>
      {permanentCount > linguistics + 1 ? (
        <p className="exalted-trait-warning" role="status">
          This record has more permanent languages than its current Linguistics
          rating would normally explain. Arcane Record leaves the final ruling
          to the Storyteller.
        </p>
      ) : null}
      <div className="exalted-background-add exalted-language-add">
        <label>
          <span>Catalog language</span>
          <select
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
          >
            <option value="">Custom / regional</option>
            {exaltedLanguageCatalog.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Custom language name</span>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <label>
          <span>Proficiency</span>
          <select
            value={proficiency}
            onChange={(event) =>
              setProficiency(event.target.value as typeof proficiency)
            }
          >
            <option value="native">Native</option>
            <option value="fluent">Fluent</option>
            <option value="limited">Limited</option>
            <option value="temporary">Temporary</option>
          </select>
        </label>
        <button
          className="secondary-button"
          type="button"
          onClick={addLanguage}
        >
          Add language
        </button>
      </div>
      {groups.map(([group, label]) => {
        const entries = languages.filter(({ proficiency }) =>
          group === 'known'
            ? proficiency === 'fluent' || proficiency === 'limited'
            : proficiency === group,
        );
        return (
          <div className="exalted-record-group" key={group}>
            <h3>{label}</h3>
            {entries.length ? (
              entries.map((language) => (
                <details className="exalted-compact-record" key={language.id}>
                  <summary>
                    <strong>
                      {language.customName ||
                        exaltedLanguageById.get(language.definitionId ?? '')
                          ?.name ||
                        'Unnamed language'}
                    </strong>
                    <span>{language.proficiency}</span>
                  </summary>
                  <div className="exalted-record-fields">
                    <label>
                      <input
                        type="checkbox"
                        checked={language.spoken}
                        onChange={(event) =>
                          onChange(
                            languages.map((entry) =>
                              entry.id === language.id
                                ? { ...entry, spoken: event.target.checked }
                                : entry,
                            ),
                          )
                        }
                      />{' '}
                      Spoken
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={language.written}
                        onChange={(event) =>
                          onChange(
                            languages.map((entry) =>
                              entry.id === language.id
                                ? { ...entry, written: event.target.checked }
                                : entry,
                            ),
                          )
                        }
                      />{' '}
                      Written
                    </label>
                    <label>
                      <span>Notes</span>
                      <textarea
                        value={language.notes}
                        onChange={(event) =>
                          onChange(
                            languages.map((entry) =>
                              entry.id === language.id
                                ? { ...entry, notes: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      className="small-button small-button--quiet"
                      type="button"
                      onClick={() =>
                        onChange(
                          languages.filter(({ id }) => id !== language.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </details>
              ))
            ) : (
              <p className="empty-inline">None recorded.</p>
            )}
          </div>
        );
      })}
    </>
  );
}
