import { formatRiskImpact } from '@/features/risks/format-risk-impact';
import type { Risk } from '@/features/risks/types';

export interface RiskImpactDisplayProps {
  risk?: Pick<Risk, 'impact_before' | 'impact_after'> | null;
  pending?: boolean;
}

/** Read-only generated impact scores (DEC-081). */
export function RiskImpactDisplay({ risk, pending = false }: RiskImpactDisplayProps) {
  if (pending || risk == null) {
    return (
      <section aria-label="Generated impacts" className="grid gap-2 rounded-md border border-sec-200 p-3">
        <h3>Generated impact</h3>
        <p>Impact scores are calculated by the database after you save likelihood and consequence.</p>
      </section>
    );
  }

  const { before, after } = formatRiskImpact(risk);

  return (
    <section aria-label="Generated impacts" className="grid gap-2 rounded-md border border-sec-200 bg-sec-50 p-3">
      <h3>Generated impact</h3>
      <dl className="grid grid-cols-2 gap-2">
        <div>
          <dt>Before controls</dt>
          <dd>
            <output>{before}</output>
          </dd>
        </div>
        <div>
          <dt>After controls</dt>
          <dd>
            <output>{after}</output>
          </dd>
        </div>
      </dl>
    </section>
  );
}
