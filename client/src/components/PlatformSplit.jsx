const PLATFORM_COLORS = {
  Facebook: '#1877F2',
  Google: '#34A853',
  TikTok: '#EE1D52',
};

function Bar({ pct, color, dim }) {
  return (
    <div className="flex-1 bg-[#1A1B24] rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: pct + '%', background: color, opacity: dim ? 0.35 : 1 }}
      />
    </div>
  );
}

export default function PlatformSplit({ platforms }) {
  if (!platforms?.length) return null;

  const totalSpend = platforms.reduce((s, p) => s + Number(p.spend), 0);
  const totalConv = platforms.reduce((s, p) => s + Number(p.conversions), 0);

  const data = platforms.map((p) => ({
    platform: p.platform,
    spendPct: (Number(p.spend) / totalSpend) * 100,
    convPct: (Number(p.conversions) / totalConv) * 100,
    cpa: Number(p.cpa),
    spend: Number(p.spend),
    conversions: Number(p.conversions),
    color: PLATFORM_COLORS[p.platform] || '#6E3BFF',
  }));

  return (
    <div className="card p-6 h-full flex flex-col">
      <div className="mb-5">
        <h2 className="text-[14px] font-medium text-[#E8E9EF]">Budget vs Conversions</h2>
        <p className="text-[12px] text-[#4B4D5E] mt-1">Facebook earns more than its budget share</p>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {data.map((p) => {
          const delta = p.convPct - p.spendPct;
          const deltaSign = delta > 0 ? '+' : '';
          const deltaColor = delta > 0 ? '#00C48C' : '#FF4D6A';

          return (
            <div key={p.platform} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium" style={{ color: p.color }}>{p.platform}</span>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                    style={{ color: p.cpa > 10 ? '#FF4D6A' : '#00C48C', background: (p.cpa > 10 ? '#FF4D6A' : '#00C48C') + '18' }}
                  >
                    CPA ${p.cpa.toFixed(2)}
                  </span>
                  <span className="text-[11px]" style={{ color: deltaColor }}>
                    {deltaSign}{delta.toFixed(1)}pp
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#4B4D5E] w-14">Spend</span>
                  <Bar pct={p.spendPct} color={p.color} dim />
                  <span className="text-[11px] text-[#9899A8] w-10 text-right">{p.spendPct.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#4B4D5E] w-14">Conv</span>
                  <Bar pct={p.convPct} color={p.color} />
                  <span className="text-[11px] text-[#E8E9EF] font-medium w-10 text-right">{p.convPct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
