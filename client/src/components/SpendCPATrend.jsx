import { useState } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function formatWeek(dateStr) {
  const d = new Date(dateStr);
  return 'Jan ' + d.getDate();
}

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildWeeklyData(daily) {
  const byWeek = {};
  daily.forEach((row) => {
    const d = new Date(row.ad_date);
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const ws = new Date(d);
    ws.setDate(d.getDate() - dow);
    const key = ws.toISOString().slice(0, 10);
    if (!byWeek[key]) byWeek[key] = { week: key, spend: 0, conversions: 0 };
    byWeek[key].spend += Number(row.spend);
    byWeek[key].conversions += Number(row.conversions);
  });
  return Object.values(byWeek)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((w) => ({ ...w, cpa: w.conversions > 0 ? w.spend / w.conversions : null, label: formatWeek(w.week) }));
}

function buildDailyData(daily) {
  const byDate = {};
  daily.forEach((row) => {
    const key = row.ad_date.slice(0, 10);
    if (!byDate[key]) byDate[key] = { date: key, spend: 0, conversions: 0 };
    byDate[key].spend += Number(row.spend);
    byDate[key].conversions += Number(row.conversions);
  });
  return Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, cpa: d.conversions > 0 ? d.spend / d.conversions : null, label: formatDay(d.date) }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-[11px] text-[#4B4D5E] mb-2 uppercase tracking-wide">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-[13px]">
          <span className="w-2 h-2 rounded-full" style={{ background: p.name === 'CPA' ? '#00C48C' : '#6E3BFF' }} />
          <span className="text-[#9899A8]">{p.name}</span>
          <span className="text-[#E8E9EF] font-medium ml-auto pl-4">
            {p.name === 'CPA' ? '$' + Number(p.value).toFixed(2) : '$' + Number(p.value).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SpendCPATrend({ daily }) {
  const [view, setView] = useState('weekly');
  const data = view === 'weekly' ? buildWeeklyData(daily) : buildDailyData(daily);

  return (
    <div className="card p-6 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-[14px] font-medium text-[#E8E9EF]">Spend & CPA Trend</h2>
          <p className="text-[12px] text-[#4B4D5E] mt-1">52% spend increase — CPA stayed flat at $9.75</p>
        </div>
        <div className="flex gap-1">
          {['weekly', 'daily'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-[12px] rounded-lg border transition-all capitalize ${
                view === v
                  ? 'border-[#6E3BFF]/60 text-[#6E3BFF] bg-[#6E3BFF]/10'
                  : 'border-[#1E1F28] text-[#4B4D5E] hover:text-[#9899A8] hover:border-[#2A2B38]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1F28" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#4B4D5E', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            yAxisId="spend"
            tick={{ fill: '#4B4D5E', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'}
            width={44}
          />
          <YAxis
            yAxisId="cpa"
            orientation="right"
            tick={{ fill: '#4B4D5E', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => '$' + v.toFixed(0)}
            domain={[0, 20]}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E1F28', radius: 4 }} />
          <Bar yAxisId="spend" dataKey="spend" name="Spend" fill="#6E3BFF" fillOpacity={0.25} radius={[4, 4, 0, 0]} barSize={view === 'weekly' ? 48 : 10} />
          <Line yAxisId="cpa" dataKey="cpa" name="CPA" stroke="#00C48C" strokeWidth={2} dot={{ r: 3, fill: '#00C48C', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <ReferenceLine yAxisId="cpa" y={10} stroke="#FF4D6A" strokeDasharray="5 4" strokeOpacity={0.5} strokeWidth={1} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
