import type { CasesSummary } from "../../types/case";

type CasesSummaryCardsProps = {
  summary: CasesSummary;
};

export default function CasesSummaryCards({
  summary,
}: CasesSummaryCardsProps) {
  return (
    <div className="stats-grid">
      <SummaryCard label="Total Cases" value={summary.total} />
      <SummaryCard label="Open Cases" value={summary.open} />
      <SummaryCard label="Needs Attention" value={summary.attention} />
      <SummaryCard label="Urgent" value={summary.urgent} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}