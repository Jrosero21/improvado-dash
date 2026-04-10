const WEEKS = [
  { label: 'All Time', value: 'All' },
  { label: 'Week of Jan 1', value: '2024-01-01' },
  { label: 'Week of Jan 8', value: '2024-01-08' },
  { label: 'Week of Jan 15', value: '2024-01-15' },
  { label: 'Week of Jan 22', value: '2024-01-22' },
  { label: 'Week of Jan 29', value: '2024-01-29' },
];

const PLATFORMS = ['All', 'Facebook', 'Google', 'TikTok'];

const PLATFORM_COLORS = {
  Facebook: '#1877F2',
  Google: '#34A853',
  TikTok: '#EE1D52',
};

export default function FilterBar({ filters, onChange, campaignList }) {
  const campaigns = ['All', ...campaignList.map((c) => c.campaign_name)];

  return (
    <div className="flex flex-wrap items-center gap-5 px-8 py-3 border-b border-[#1E1F28]">
      {/* Week */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-medium text-[#4B4D5E] uppercase tracking-widest">Week</span>
        <select
          value={filters.week}
          onChange={(e) => onChange({ ...filters, week: e.target.value })}
          className="bg-[#111217] border border-[#1E1F28] text-[#E8E9EF] text-[13px] rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-[#6E3BFF]/50 transition-colors"
        >
          {WEEKS.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-4 bg-[#1E1F28]" />

      {/* Platform */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-medium text-[#4B4D5E] uppercase tracking-widest">Platform</span>
        <div className="flex gap-1.5">
          {PLATFORMS.map((p) => {
            const active = filters.platform === p;
            const color = PLATFORM_COLORS[p];
            return (
              <button
                key={p}
                onClick={() => onChange({ ...filters, platform: p })}
                style={
                  active
                    ? {
                        borderColor: color || '#6E3BFF',
                        color: color || '#6E3BFF',
                        background: (color || '#6E3BFF') + '18',
                      }
                    : {}
                }
                className={`px-3 py-1 text-[12px] rounded-lg border transition-all ${
                  active
                    ? ''
                    : 'border-[#1E1F28] text-[#4B4D5E] hover:border-[#2A2B38] hover:text-[#9899A8]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-4 bg-[#1E1F28]" />

      {/* Campaign */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-medium text-[#4B4D5E] uppercase tracking-widest">Campaign</span>
        <select
          value={filters.campaign}
          onChange={(e) => onChange({ ...filters, campaign: e.target.value })}
          className="bg-[#111217] border border-[#1E1F28] text-[#E8E9EF] text-[13px] rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-[#6E3BFF]/50 transition-colors max-w-[200px]"
        >
          {campaigns.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Campaigns' : c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
