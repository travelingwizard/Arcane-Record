import { SheetNotice } from '../../components/layout/SheetPrimitives';
import { earthdawnHalfMagicRule } from './half-magic';

export function HalfMagicRule() {
  return (
    <SheetNotice>
      <strong>Half-Magic</strong>
      {earthdawnHalfMagicRule.split('\n\n').map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </SheetNotice>
  );
}

export function HalfMagicUses({
  name,
  circle,
  uses,
}: {
  name: string;
  circle?: number;
  uses: string;
}) {
  return (
    <p>
      <strong>{name} Half-Magic.</strong>{' '}
      {circle != null
        ? `Half-Magic Step = Circle ${circle} + the Attribute Step the gamemaster chooses. `
        : null}
      {uses}
    </p>
  );
}
