import { useState } from 'react';
import {
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import { randomDie, resolveDie } from './dice';
import type { ArsCharacter } from './schema';

export function DicePanel({
  character,
  onChange,
}: {
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
}) {
  const [kind, setKind] = useState<'simple' | 'stress'>('stress');
  const [purpose, setPurpose] =
    useState<ArsCharacter['rolls'][number]['purpose']>('general');
  const [modifier, setModifier] = useState(0);
  const [count, setCount] = useState(1);
  const [context, setContext] = useState('');
  const [error, setError] = useState('');
  const roll = () => {
    try {
      const dice = [randomDie()];
      if (kind === 'stress')
        while (dice.at(-1) === 1) {
          if (dice.length >= 40)
            throw new Error(
              'Explosion chain requires manual review. No result was recorded.',
            );
          dice.push(randomDie());
        }
      const botchDice =
        kind === 'stress' && dice[0] === 0
          ? Array.from({ length: count }, () => randomDie())
          : [];
      const result = resolveDie(kind, dice, botchDice, modifier);
      onChange({
        ...character,
        rolls: [
          ...character.rolls,
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            kind,
            purpose,
            dice,
            botchDice,
            modifier,
            total: result.total,
            context,
            provenance: 'generated',
          },
        ],
      });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Roll failed.');
    }
  };
  return (
    <>
      <p>
        Core p. 7. Choose applicable botch dice; narrative consequences remain
        with the troupe. This basic helper does not yet calculate casting,
        Confidence, combat, aging, or Twilight modifiers.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Die type">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="simple">Simple</option>
            <option value="stress">Stress</option>
          </select>
        </SheetField>
        <SheetField label="Purpose">
          <select
            value={purpose}
            onChange={(e) =>
              setPurpose(
                e.target.value as ArsCharacter['rolls'][number]['purpose'],
              )
            }
          >
            <option value="general">General</option>
            <option value="casting">Casting</option>
            <option value="combat">Combat</option>
            <option value="recovery">Recovery</option>
            <option value="aging">Aging</option>
            <option value="twilight">Twilight</option>
          </select>
        </SheetField>
        <SheetField label="Modifier">
          <input
            type="number"
            value={modifier}
            onChange={(e) => {
              if (Number.isSafeInteger(e.target.valueAsNumber))
                setModifier(e.target.valueAsNumber);
            }}
          />
        </SheetField>
        <SheetField label="Botch dice">
          <input
            type="number"
            min={0}
            max={100}
            disabled={kind === 'simple'}
            value={count}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isInteger(n) && n >= 0 && n <= 100) setCount(n);
            }}
          />
        </SheetField>
        <SheetField label="Roll context">
          <input value={context} onChange={(e) => setContext(e.target.value)} />
        </SheetField>
      </SheetFieldGrid>
      <SheetToolbar>
        <button className="primary-button" onClick={roll}>
          Roll d10
        </button>
      </SheetToolbar>
      {error && <SheetNotice tone="danger">{error}</SheetNotice>}
      <ol>
        {character.rolls
          .slice(-10)
          .reverse()
          .map((r) => (
            <li key={r.id}>
              {r.purpose} {r.kind}: {r.dice.join(', ')}; botch dice:{' '}
              {r.botchDice.join(', ') || 'none'}; modifier {r.modifier}; total{' '}
              {r.total}. {r.context}
            </li>
          ))}
      </ol>
    </>
  );
}
