import type { BackgroundTotals } from '../../../systems/mage-m20/background-rules';

export function BackgroundSummary({ totals }: { totals: BackgroundTotals }) {
  return (
    <details className="background-summary" open>
      <summary>
        Backgrounds {totals.pointsSpent}/{totals.standardAllowance} ·{' '}
        {totals.pointsOver > 0
          ? `${totals.pointsOver} over`
          : `${totals.pointsRemaining} remaining`}
      </summary>
      <div className="background-summary__details">
        <div>
          <span>Points spent</span>
          <strong>{totals.pointsSpent} points</strong>
        </div>
        <div>
          <span>Standard allowance</span>
          <strong>{totals.standardAllowance} points</strong>
        </div>
        <div>
          <span>
            {totals.pointsOver > 0 ? 'Over allowance' : 'Points remaining'}
          </span>
          <strong>
            {totals.pointsOver > 0 ? totals.pointsOver : totals.pointsRemaining}{' '}
            points
          </strong>
        </div>
        <div>
          <span>Selected</span>
          <strong>
            {totals.selectedCount}{' '}
            {totals.selectedCount === 1 ? 'Background' : 'Backgrounds'}
          </strong>
        </div>
      </div>
      {totals.unresolvedCount > 0 ? (
        <p className="background-summary__unresolved">
          {totals.unresolvedCount} unresolved{' '}
          {totals.unresolvedCount === 1 ? 'reference is' : 'references are'} not
          included in the point total.
        </p>
      ) : null}
    </details>
  );
}
