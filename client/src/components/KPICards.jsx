function fmt(val, type) {
  if (val == null || isNaN(Number(val))) return '—';
  const n = Number(val);
  switch (type) {
    case 'currency': return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    case 'currency2': return '$' + n.toFixed(2);
    case 'number': return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    case 'percent': return (n * 100).toFixed(2) + '%';
    default: return String(val);
  }
}

function KPICard({ label, value, sub, accent, alert, good }) {
  const valueColor = alert ? '#FF4D6A' : good ? '#00C48C' : '#E8E9EF';
  const dotColor = alert ? '#FF4D6A' : good ? '#00C48C' : '#6E3BFF';

  return (
    <div className="card px-5 py-5 flex flex-col gap-3 relative overflow-hidden">
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[14px]"
        style={{ background: accent || dotColor, opacity: 0.7 }}
      />

      <span className="text-[11px] font-medium text-[#4B4D5E] uppercase tracking-widest mt-1">{label}</span>

      <div className="flex flex-col gap-1">
        <span className="text-[28px] font-medium leading-none tracking-tight" style={{ color: valueColor }}>
          {value}
        </span>
        {sub && <span className="text-[12px] text-[#4B4D5E]">{sub}</span>}
      </div>
    </div>
  );
}

export default function KPICards({ summary, platforms }) {
  if (!summary) return null;

  const totalSpend = platforms?.reduce((s, p) => s + Number(p.spend), 0) || 0;
  const efficientSpend = platforms?.reduce((s, p) => Number(p.cpa) <= 10 ? s + Number(p.spend) : s, 0) || 0;
  const efficiencyPct = totalSpend > 0 ? Math.round((efficientSpend / totalSpend) * 100) : null;
  const cpa = Number(summary.blended_cpa);

  return (
    <div className="grid grid-cols-5 gap-4">
      <KPICard
        label="Total Spend"
        value={fmt(summary.total_spend, 'currency')}
        sub="Jan 1 – 30, 2024"
        accent="#6E3BFF"
      />
      <KPICard
        label="Total Conversions"
        value={fmt(summary.total_conversions, 'number')}
        sub={`${fmt(summary.total_conversions / (summary.days_count || 30), 'number')} / day avg`}
        accent="#6E3BFF"
      />
      <KPICard
        label="Blended CPA"
        value={fmt(summary.blended_cpa, 'currency2')}
        sub="Target: under $10.00"
        alert={cpa > 10}
        good={cpa <= 10}
        accent={cpa > 10 ? '#FF4D6A' : '#00C48C'}
      />
      <KPICard
        label="Blended CTR"
        value={fmt(summary.blended_ctr, 'percent')}
        sub={`${fmt(summary.total_clicks, 'number')} clicks total`}
        accent="#6E3BFF"
      />
      <KPICard
        label="Budget Efficiency"
        value={efficiencyPct != null ? efficiencyPct + '%' : '—'}
        sub="of spend below $10 CPA"
        good={efficiencyPct != null && efficiencyPct >= 50}
        alert={efficiencyPct != null && efficiencyPct < 50}
        accent={efficiencyPct != null && efficiencyPct >= 50 ? '#00C48C' : '#FF4D6A'}
      />
    </div>
  );
}
