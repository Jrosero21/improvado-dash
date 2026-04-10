const PLATFORM_COLORS = {
  Facebook: '#1877F2',
  Google: '#34A853',
  TikTok: '#EE1D52',
};

function fmt(val, type) {
  if (val == null || isNaN(Number(val))) return '—';
  const n = Number(val);
  switch (type) {
    case 'currency': return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    case 'currency2': return '$' + n.toFixed(2);
    case 'percent': return (n * 100).toFixed(2) + '%';
    default: return String(val);
  }
}

export default function PlatformTable({ platforms }) {
  if (!platforms?.length) return null;

  const sorted = [...platforms].sort((a, b) => Number(a.cpa) - Number(b.cpa));

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h2 className="text-[14px] font-medium text-[#E8E9EF]">Platform Metrics</h2>
      </div>
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="border-b border-[#1E1F28]">
            {['Platform', 'Spend', 'CPM', 'CTR', 'Conv Rate', 'CPA'].map((h) => (
              <th key={h} className="text-left text-[10px] font-medium text-[#4B4D5E] uppercase tracking-widest pb-2.5 pr-3 last:pr-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const over = Number(p.cpa) > 10;
            return (
              <tr key={p.platform} className="border-b border-[#111217] hover:bg-[#1A1B24] transition-colors">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_COLORS[p.platform] }} />
                    <span className="font-medium" style={{ color: PLATFORM_COLORS[p.platform] }}>{p.platform}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-[#E8E9EF]">{fmt(p.spend, 'currency')}</td>
                <td className="py-3 pr-3 text-[#9899A8]">{fmt(p.cpm, 'currency2')}</td>
                <td className="py-3 pr-3 text-[#9899A8]">{fmt(p.ctr, 'percent')}</td>
                <td className="py-3 pr-3 text-[#9899A8]">{fmt(p.conv_rate, 'percent')}</td>
                <td className="py-3">
                  <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                    style={{
                      color: over ? '#FF4D6A' : '#00C48C',
                      background: over ? 'rgba(255,77,106,0.1)' : 'rgba(0,196,140,0.1)',
                    }}
                  >
                    {fmt(p.cpa, 'currency2')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
