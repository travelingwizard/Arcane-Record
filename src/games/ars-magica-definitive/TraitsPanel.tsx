import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
} from '../../components/layout/SheetPrimitives';
import { scoreFromExperience } from './experience';
import type { ArsCharacter } from './schema';

export function TraitsPanel({
  character,
  onChange,
  scale,
}: {
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
  scale: 'art' | 'ability';
}) {
  const locked = character.mode === 'play';
  const traits = character.definition.traits.filter((t) => t.scale === scale);
  return (
    <>
      <p>
        Scores derive from earned experience. Temporary and Virtue bonuses are
        not included here.
      </p>
      {traits.map((trait) => (
        <SheetCard key={trait.id} density="compact">
          <SheetFieldGrid columns={3}>
            <SheetField label="Name">
              <input
                value={trait.name}
                readOnly={locked}
                onChange={(e) =>
                  onChange({
                    ...character,
                    definition: {
                      ...character.definition,
                      traits: character.definition.traits.map((t) =>
                        t.id === trait.id ? { ...t, name: e.target.value } : t,
                      ),
                    },
                  })
                }
              />
            </SheetField>
            <SheetField label="Earned experience">
              <input
                type="number"
                min={0}
                step={1}
                value={trait.experience}
                readOnly={locked}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isSafeInteger(n) && n >= 0)
                    onChange({
                      ...character,
                      definition: {
                        ...character.definition,
                        traits: character.definition.traits.map((t) =>
                          t.id === trait.id ? { ...t, experience: n } : t,
                        ),
                      },
                    });
                }}
              />
            </SheetField>
            <SheetField label="Earned score">
              <output>{scoreFromExperience(trait.experience, scale)}</output>
            </SheetField>
          </SheetFieldGrid>
          <p>
            {trait.status === 'custom'
              ? 'Custom definition'
              : trait.status === 'unresolved'
                ? 'Unresolved definition — retained'
                : 'Verified definition'}
          </p>
        </SheetCard>
      ))}
      {!locked && (
        <button
          className="secondary-button"
          onClick={() =>
            onChange({
              ...character,
              definition: {
                ...character.definition,
                traits: [
                  ...character.definition.traits,
                  {
                    id: crypto.randomUUID(),
                    definitionId: null,
                    name: '',
                    status: 'custom',
                    citation: null,
                    notes: '',
                    scale,
                    experience: 0,
                    specialty: '',
                  },
                ],
              },
            })
          }
        >
          Add custom {scale === 'art' ? 'Art' : 'Ability'}
        </button>
      )}
    </>
  );
}
