import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const avg = 445;
  const pct = ((Number(d?.avg_conversions) - avg) / avg * 100).toFixed(1);
  const sign = pct > 0 ? '+' : '';
  const isThursday = d?.day_name === 'Thursday';
  return (
    <div className="custom-tooltip">
      <p className="text-[13px] font-medium mb-2" style={{ color: isThursday ? '#6E3BFF' : '#E8E9EF' }}>{d?.day_name}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-5 text-[12px]">
          <span className="text-[#4B4D5E]">Avg Conversions</span>
          <span className="text-[#E8E9EF] font-medium">{Number(d?.avg_conversions).toFixed(0)}</span>
        </div>
        <div className="flex justify-between gap-5 text-[12px]">
          <span className="text-[#4B4D5E]">vs average</span>
          <span style={{ color: pct > 0 ? '#00C48C' : '#FF4D6A' }}>{sign}{pct}%</span>
        </div>
        <div className="flex justify-between gap-5 text-[12px]">
          <span className="text-[#4B4D5E]">Avg Spend</span>
          <span className="text-[#9899A8]">${Number(d?.avg_spend).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </div>
        <div className="flex justify-between gap-5 text-[12px]">
          <span className="text-[#4B4D5E]">Avg CPA</span>
          <span className="text-[#9899A8]">${Number(d?.avg_cpa).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default function DayOfWeek({ dayofweek }) {
  if (!dayofweek?.length) return null;

  const sorted = DAY_ORDER
    .map((day) => dayofweek.find((d) => d.day_name === day))
    .filter(Boolean)
    .map((d) => ({ ...d, label: DAY_SHORT[d.day_name] }));

  const avg = sorted.reduce((s, d) => s + Number(d.avg_conversions), 0) / sorted.length;

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h2 className="text-[14px] font-medium text-[#E8E9EF]">Performance by Day</h2>
        <p className="text-[12px] text-[#4B4D5E] mt-1">Thursday: +11% conversions vs average</p>
      </div>
      <ResponsiveContainer width="100%" height={165}>
        <BarChart data={sorted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1F28" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#4B4D5E', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} dy={5} />
          <YAxis tick={{ fill: '#4B4D5E', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E1F28', radius: 4 }} />
          <ReferenceLine y={avg} stroke="#6E3BFF" strokeDasharray="5 4" strokeOpacity={0.4} strokeWidth={1} />
          <Bar dataKey="avg_conversions" radius={[4, 4, 0, 0]} barSize={26}>
            {sorted.map((entry) => (
              <Cell
                key={entry.day_name}
                fill="#6E3BFF"
                fillOpacity={entry.day_name === 'Thursday' ? 1 : 0.28}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
