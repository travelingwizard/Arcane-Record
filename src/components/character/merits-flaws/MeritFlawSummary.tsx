import {
  meritFlawRules,
  type MeritFlawTotals,
} from '../../../systems/mage-m20/merit-flaw-rules';

export function MeritFlawSummary({ totals }: { totals: MeritFlawTotals }) {
  return (
    <details className="merit-flaw-summary" open>
      <summary>
        Merits {totals.meritPointTotal} · Flaws {totals.flawPointTotal}/
        {meritFlawRules.maximumFlawPointsGranted} · Net{' '}
        {totals.netCharacterCreationCost}
      </summary>
      <div className="merit-flaw-summary__details">
        <div>
          <span>Merits</span>
          <strong>{totals.meritPointTotal} points</strong>
          <small>
            {totals.meritCount}{' '}
            {totals.meritCount === 1 ? 'selection' : 'selections'}
          </small>
        </div>
        <div>
          <span>Flaws</span>
          <strong>
            {totals.flawPointTotal} of {meritFlawRules.maximumFlawPointsGranted}{' '}
            points
          </strong>
          <small>
            {totals.flawCount}{' '}
            {totals.flawCount === 1 ? 'selection' : 'selections'}
          </small>
        </div>
        <div>
          <span>Remaining allowance</span>
          <strong>{totals.remainingFlawAllowance} points</strong>
          <small>Standard Flaw benefit</small>
        </div>
        <div>
          <span>Net creation cost</span>
          <strong>{totals.netCharacterCreationCost} points</strong>
          <small>Merits minus granted Flaws</small>
        </div>
      </div>
      {totals.excessFlawPoints > 0 ? (
        <div className="merit-flaw-summary__excess">
          <strong>Flaws selected: {totals.flawPointTotal} points</strong>
          <span>
            Standard benefit granted: {totals.flawPointsGranted} points
          </span>
          <span>
            Excess Flaws: {totals.excessFlawPoints}{' '}
            {totals.excessFlawPoints === 1 ? 'point' : 'points'}
          </span>
        </div>
      ) : null}
    </details>
  );
}
