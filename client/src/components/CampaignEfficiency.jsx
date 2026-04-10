import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from 'recharts';

const PLATFORM_COLORS = {
  Facebook: '#1877F2',
  Google: '#34A853',
  TikTok: '#EE1D52',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const color = PLATFORM_COLORS[d.platform] || '#6E3BFF';
  return (
    <div className="custom-tooltip min-w-[180px]">
      <p className="text-[13px] font-medium text-[#E8E9EF] mb-0.5">{d.campaign_name}</p>
      <p className="text-[11px] mb-2" style={{ color }}>{d.platform}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-6 text-[12px]">
          <span className="text-[#4B4D5E]">CPA</span>
          <span style={{ color: Number(d.cpa) > 10 ? '#FF4D6A' : '#00C48C' }} className="font-medium">${Number(d.cpa).toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6 text-[12px]">
          <span className="text-[#4B4D5E]">Spend</span>
          <span className="text-[#E8E9EF]">${Number(d.spend).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between gap-6 text-[12px]">
          <span className="text-[#4B4D5E]">Conversions</span>
          <span className="text-[#E8E9EF]">{Number(d.conversions).toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-6 text-[12px]">
          <span className="text-[#4B4D5E]">CTR</span>
          <span className="text-[#E8E9EF]">{(Number(d.ctr) * 100).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
};

export default function CampaignEfficiency({ campaigns }) {
  if (!campaigns?.length) return null;

  const sorted = [...campaigns]
    .sort((a, b) => Number(a.cpa) - Number(b.cpa))
    .map((c) => ({
      ...c,
      shortName: c.campaign_name.replace(/_/g, ' '),
    }));

  return (
    <div className="card p-6">
      <div className="mb-5">
        <h2 className="text-[14px] font-medium text-[#E8E9EF]">Campaign Efficiency</h2>
        <p className="text-[12px] text-[#4B4D5E] mt-1">Sorted by CPA — red line marks $10 target</p>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 72, left: 12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1F28" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#4B4D5E', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => '$' + v}
            domain={[0, 28]}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fill: '#9899A8', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            width={150}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E1F28' }} />
          <ReferenceLine x={10} stroke="#FF4D6A" strokeDasharray="5 4" strokeOpacity={0.6} strokeWidth={1} />
          <Bar dataKey="cpa" radius={[0, 4, 4, 0]} barSize={16}>
            {sorted.map((entry) => (
              <Cell
                key={entry.campaign_name}
                fill={PLATFORM_COLORS[entry.platform] || '#6E3BFF'}
                fillOpacity={Number(entry.cpa) > 10 ? 0.85 : 0.55}
              />
            ))}
            <LabelList
              dataKey="cpa"
              position="right"
              formatter={(v) => '$' + Number(v).toFixed(2)}
              style={{ fill: '#4B4D5E', fontSize: 11, fontFamily: 'Inter' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
