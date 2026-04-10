import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ACCENT = "#5B39F5";
const PLT = { facebook: "#1877F2", google: "#34A853", tiktok: "#EE1D52" };
const T = { sidebar:"#0D0E12", bg:"#F4F5F8", card:"#FFFFFF", text:"#111827", sub:"#6B7280", border:"#E5E7EB", green:"#059669", red:"#DC2626", amber:"#D97706" };

const f = {
  $: v => v==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(+v),
  $2: v => v==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(+v),
  n: v => v==null?"—":new Intl.NumberFormat("en-US").format(Math.round(+v)),
  pct: v => v==null?"—":(+v).toFixed(2)+"%",
  k: v => { if(v==null)return"—"; const n=+v; if(n>=1e6)return(n/1e6).toFixed(1)+"M"; if(n>=1e3)return(n/1e3).toFixed(1)+"K"; return Math.round(n).toString(); },
  date: s => { if(!s)return""; const d=new Date(s); return`${d.getMonth()+1}/${d.getDate()}`; },
  delta: (a,b) => (!b||+b===0)?null:((+a-+b)/Math.abs(+b))*100,
};

const API_BASE = import.meta.env.VITE_API_URL || "";

const get = async (path, params={}) => {
  const base = API_BASE ? API_BASE.replace(/\/$/, "") + "/api/" + path : "/api/" + path;
  const u = new URL(base, window.location.origin);
  Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
  const r = await fetch(u.toString());
  if(!r.ok) throw new Error("API "+r.status);
  return r.json();
};

const ICONS = {
  logo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  grid: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  trend: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  table: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>,
  chat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  close: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  send: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  up: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>,
  dn: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
};

function KPI({ label, value, delta, flip=false }) {
  const good = flip ? delta < 0 : delta > 0;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px 20px", flex:1, minWidth:120 }}>
      <div style={{ fontSize:11, color:T.sub, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.025em", color:T.text, lineHeight:1.1 }}>{value}</div>
      {delta!=null && (
        <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:3, fontSize:12, color:good?T.green:T.red }}>
          {good?ICONS.up:ICONS.dn}
          <span style={{ fontWeight:600 }}>{Math.abs(delta).toFixed(1)}%</span>
          <span style={{ color:T.sub, fontWeight:400 }}>vs prior</span>
        </div>
      )}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{ background:T.sidebar, borderRadius:9, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:"#6B7280", marginBottom:5, fontSize:11 }}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:14, color:"#fff", marginBottom:2 }}>
          <span style={{ color:p.color }}>{String(p.name).replace(/_spend$/,"")}</span>
          <span style={{ fontWeight:600 }}>{f.$2(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const plt = (p) => PLT[p?.toLowerCase()] || ACCENT;

function Pill({ platform }) {
  const c = plt(platform);
  return <span style={{ background:c+"18", color:c, padding:"2px 7px", borderRadius:5, fontSize:11, fontWeight:600, textTransform:"capitalize" }}>{platform}</span>;
}

function FunnelRow({ label, count, total }) {
  const pct = total>0?(count/total)*100:0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
        <span style={{ color:T.sub }}>{label}</span>
        <span style={{ fontWeight:600 }}>{f.k(count)} <span style={{ color:T.sub, fontWeight:400 }}>· {pct.toFixed(0)}%</span></span>
      </div>
      <div style={{ background:T.bg, borderRadius:3, height:4 }}>
        <div style={{ background:PLT.tiktok, height:"100%", borderRadius:3, width:Math.min(100,pct)+"%" }} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderTop:`1px solid ${T.border}`, fontSize:13 }}>
      <span style={{ color:T.sub }}>{label}</span>
      <span style={{ fontWeight:600 }}>{value}</span>
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px 22px", ...style }}>{children}</div>;
}

export default function App() {
  const [days, setDays] = useState(30);
  const [activePlatform, setActivePlatform] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [campaignList, setCampaignList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [D, setD] = useState({});
  const [chatOpen, setChatOpen] = useState(true);
  const [msgs, setMsgs] = useState([
    { role:"assistant", content:"I have full context of your live campaign data. Ask me anything — budget reallocation, platform efficiency, funnel analysis, or what to prioritize next." }
  ]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const inpRef = useRef(null);

  const filters = Object.fromEntries(
    Object.entries({ days, platform: activePlatform, campaign: activeCampaign }).filter(([,v]) => v != null)
  );

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const [ov,pv,pl,ts,ca,tk,gg,fb,cl] = await Promise.all([
        get("overview", filters), get("overview", { days, prev: 1 }),
        get("platforms", filters), get("timeseries", filters),
        get("campaigns", { ...filters, limit:10 }),
        get("tiktok-funnel", { days }), get("google-quality", { days }),
        get("facebook-engagement", { days }), get("campaigns", { list: 1 }),
      ]);
      setD({ov,pv,pl,ts,ca,tk,gg,fb});
      setCampaignList(cl);
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [days, activePlatform, activeCampaign]);

  useEffect(()=>{ load(); },[load]);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const pivot = (() => {
    const m={};
    (D.ts||[]).forEach(r=>{ const d=String(r.date).split("T")[0]; if(!m[d])m[d]={date:d}; m[d][r.platform+"_spend"]=+r.spend; });
    return Object.values(m).sort((a,b)=>a.date.localeCompare(b.date));
  })();

  const buildCtx = () => {
    const {ov,pl,ca,tk,gg,fb}=D;
    if(!ov) return "";
    return `Senior paid media analyst. Be specific, quantitative, no filler.
Period: last ${days} days | Spend: ${f.$2(ov.total_spend)} | CTR: ${f.pct(ov.ctr)} | CPA: ${f.$2(ov.cpa)} | CVR: ${f.pct(ov.cvr)} | Conversions: ${f.n(ov.total_conversions)}
Platforms:\n${(pl||[]).map(p=>`  ${p.platform}: spend=${f.$2(p.spend)} CTR=${f.pct(p.ctr)} CPA=${f.$2(p.cpa)} CVR=${f.pct(p.cvr)}`).join("\n")}
Top campaigns:\n${(ca||[]).slice(0,5).map(c=>`  [${c.platform}] ${c.campaign_name}: spend=${f.$2(c.spend)} conv=${c.conversions} CPA=${f.$2(c.cpa)}`).join("\n")}
${tk?`TikTok funnel: views=${f.n(tk.views)} 25%=${tk.views>0?(tk.watch_25/tk.views*100).toFixed(0):0}% complete=${tk.views>0?(tk.watch_100/tk.views*100).toFixed(0):0}%`:""}
${gg?`Google: QS=${(+gg.avg_quality_score).toFixed(1)}/10 ROAS=${(+gg.roas).toFixed(2)}x imp_share=${(+gg.avg_impression_share).toFixed(0)}%`:""}
${fb?`Facebook: freq=${(+fb.avg_frequency).toFixed(2)}x engagement=${f.pct(fb.avg_engagement_rate)} reach=${f.n(fb.total_reach)}`:""}`;
  };

  const send = async (text) => {
    const t=(text||inp).trim(); if(!t||busy) return;
    setInp("");
    const um={role:"user",content:t};
    setMsgs(p=>[...p,um]); setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          system: buildCtx(),
          messages: [...msgs.slice(1).map(m=>({role:m.role,content:m.content})),um],
        }),
      });
      const data = await res.json();
      const reply = data.content || data.error || "No response.";
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    } catch { setMsgs(p=>[...p,{role:"assistant",content:"Connection error."}]); }
    finally { setBusy(false); }
  };

  if(loading) return (
    <div style={{ height:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:32,height:32, border:`2.5px solid ${T.border}`, borderTopColor:ACCENT, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 12px" }}/>
        <div style={{ fontSize:13,color:T.sub }}>Loading</div>
      </div>
    </div>
  );

  if(err) return (
    <div style={{ height:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"36px 40px", maxWidth:420, textAlign:"center" }}>
        <div style={{ fontSize:14,fontWeight:600,marginBottom:6 }}>Backend not running</div>
        <div style={{ fontSize:13,color:T.sub,marginBottom:20,lineHeight:1.7 }}>Start the API server then refresh.</div>
        <code style={{ display:"block", background:T.bg, borderRadius:8, padding:"12px 16px", fontSize:13, color:ACCENT, marginBottom:20, textAlign:"left", lineHeight:1.8 }}>
          cd server<br/>node index.js
        </code>
        <button onClick={load} style={{ background:ACCENT,color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",cursor:"pointer",fontSize:13,fontWeight:500 }}>Retry</button>
      </div>
    </div>
  );

  const {ov,pv,pl,ca,tk,gg,fb}=D;
  const totalSpend=+(ov?.total_spend||0);

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Inter',-apple-system,sans-serif", color:T.text, overflow:"hidden" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        input:focus{outline:2px solid ${ACCENT}44}
        button{font-family:inherit;cursor:pointer}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width:52,background:T.sidebar, display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0 20px",flexShrink:0,gap:4 }}>
        <div style={{ width:28,height:28,background:ACCENT,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28 }}>
          {ICONS.logo}
        </div>
        {[[ICONS.grid,true],[ICONS.trend,false],[ICONS.table,false]].map(([icon,active],i)=>(
          <div key={i} style={{ width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:active?"#fff":"#4B5563",background:active?"rgba(255,255,255,0.1)":"transparent" }}>
            {icon}
          </div>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ width:26,height:26,borderRadius:"50%",background:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff" }}>A</div>
      </aside>

      {/* Main */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0,background:T.bg,overflow:"hidden" }}>

        {/* Header */}
        <header style={{ background:T.card,borderBottom:`1px solid ${T.border}`,padding:"0 24px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          <div>
            <div style={{ fontSize:14,fontWeight:700 }}>Overview</div>
            <div style={{ fontSize:11,color:T.sub }}>{ov.date_from} – {ov.date_to}</div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ display:"flex",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:3 }}>
              {[7,14,30,90].map(d=>(
                <button key={d} onClick={()=>setDays(d)} style={{ background:days===d?ACCENT:"transparent",color:days===d?"#fff":T.sub,border:"none",borderRadius:6,padding:"4px 11px",fontSize:12,fontWeight:days===d?600:400,transition:"all .15s" }}>{d}d</button>
              ))}
            </div>
            <button onClick={()=>{ setChatOpen(o=>!o); setTimeout(()=>inpRef.current?.focus(),80); }} style={{ display:"flex",alignItems:"center",gap:6,background:chatOpen?ACCENT:T.card,color:chatOpen?"#fff":T.text,border:`1px solid ${chatOpen?ACCENT:T.border}`,borderRadius:8,padding:"6px 13px",fontSize:12,fontWeight:500,transition:"all .15s" }}>
              {ICONS.chat} Analyst
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"8px 24px", display:"flex", alignItems:"center", gap:20, flexShrink:0, flexWrap:"wrap" }}>
          {/* Platform toggles */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:T.sub, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>Platform</span>
            <div style={{ display:"flex", gap:4 }}>
              {["Facebook","Google","TikTok"].map(p => {
                const color = plt(p);
                const active = activePlatform === p;
                return (
                  <button key={p} onClick={() => setActivePlatform(active ? null : p)}
                    style={{ padding:"3px 11px", borderRadius:6, fontSize:12, fontWeight:active?600:400, border:`1px solid ${active ? color : T.border}`, background: active ? color+"18" : "transparent", color: active ? color : T.sub, cursor:"pointer", transition:"all .15s" }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ width:1, height:16, background:T.border }} />
          {/* Campaign dropdown */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:T.sub, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>Campaign</span>
            <select value={activeCampaign||""} onChange={e => setActiveCampaign(e.target.value || null)}
              style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 10px", fontSize:12, color:T.text, fontFamily:"inherit", cursor:"pointer" }}>
              <option value="">All Campaigns</option>
              {campaignList.map(c => <option key={c.campaign_name} value={c.campaign_name}>{c.campaign_name}</option>)}
            </select>
          </div>
          {(activePlatform || activeCampaign) && (
            <button onClick={() => { setActivePlatform(null); setActiveCampaign(null); }}
              style={{ fontSize:11, color:T.sub, background:"transparent", border:`1px solid ${T.border}`, borderRadius:6, padding:"3px 9px", cursor:"pointer" }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        <main style={{ flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:16 }}>

          {/* KPIs */}
          <div style={{ display:"flex",gap:12 }}>
            <KPI label="Spend" value={f.$(totalSpend)} delta={f.delta(ov.total_spend,pv.total_spend)} flip/>
            <KPI label="Impressions" value={f.k(ov.total_impressions)} delta={f.delta(ov.total_impressions,pv.total_impressions)}/>
            <KPI label="Clicks" value={f.k(ov.total_clicks)} delta={f.delta(ov.total_clicks,pv.total_clicks)}/>
            <KPI label="Conversions" value={f.n(ov.total_conversions)} delta={f.delta(ov.total_conversions,pv.total_conversions)}/>
            <KPI label="CPA" value={f.$2(ov.cpa)} delta={f.delta(ov.cpa,pv.cpa)} flip/>
          </div>

          {/* Trend + Mix */}
          <div style={{ display:"flex",gap:16 }}>
            <Card style={{ flex:"0 0 62%",minWidth:0 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:600 }}>Daily spend</div>
                  <div style={{ fontSize:11,color:T.sub,marginTop:2 }}>{days}-day trend by platform</div>
                </div>
                <div style={{ display:"flex",gap:14 }}>
                  {(pl||[]).map(p=>(
                    <span key={p.platform} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.sub }}>
                      <span style={{ width:16,height:2,background:plt(p.platform),display:"inline-block",borderRadius:1 }}/>
                      {p.platform}
                    </span>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={pivot} margin={{top:2,right:2,bottom:0,left:0}}>
                  <CartesianGrid strokeDasharray="4 4" stroke={T.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={f.date} interval={Math.max(0,Math.floor(pivot.length/7))}/>
                  <YAxis tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+f.k(v)} width={46}/>
                  <Tooltip content={<ChartTip/>}/>
                  {(pl||[]).map(p=>(
                    <Line key={p.platform} type="monotone" dataKey={p.platform+"_spend"} stroke={plt(p.platform)} strokeWidth={2} dot={false} name={p.platform}/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:600,marginBottom:2 }}>Platform mix</div>
              <div style={{ fontSize:11,color:T.sub,marginBottom:20 }}>Share of spend</div>
              {(pl||[]).map(p=>{
                const pct=totalSpend>0?(+p.spend/totalSpend)*100:0;
                return (
                  <div key={p.platform} style={{ marginBottom:13 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                      <span style={{ color:T.sub,textTransform:"capitalize" }}>{p.platform}</span>
                      <span style={{ fontWeight:600 }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ background:T.bg,borderRadius:3,height:4 }}>
                      <div style={{ background:plt(p.platform),height:"100%",borderRadius:3,width:pct+"%" }}/>
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop:`1px solid ${T.border}`,marginTop:16,paddingTop:14 }}>
                <table style={{ width:"100%",fontSize:12,borderCollapse:"collapse" }}>
                  <thead><tr>
                    {["","CTR","CPA","CVR"].map(h=><th key={h} style={{ textAlign:h?"right":"left",color:T.sub,paddingBottom:8,fontWeight:500,fontSize:10,textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(pl||[]).map(p=>(
                      <tr key={p.platform}>
                        <td style={{ padding:"6px 0",fontWeight:600,color:plt(p.platform),textTransform:"capitalize",fontSize:12 }}>{p.platform}</td>
                        <td style={{ textAlign:"right",padding:"6px 0" }}>{f.pct(p.ctr)}</td>
                        <td style={{ textAlign:"right",padding:"6px 0" }}>{f.$2(p.cpa)}</td>
                        <td style={{ textAlign:"right",padding:"6px 0",color:T.sub }}>{f.pct(p.cvr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Platform panels */}
          <div style={{ display:"flex",gap:16 }}>
            {tk && (
              <Card style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
                  <Pill platform="tiktok"/>
                  <span style={{ fontSize:13,fontWeight:600 }}>Video funnel</span>
                </div>
                <FunnelRow label="Views" count={tk.views} total={tk.views}/>
                <FunnelRow label="25% watched" count={tk.watch_25} total={tk.views}/>
                <FunnelRow label="50% watched" count={tk.watch_50} total={tk.views}/>
                <FunnelRow label="75% watched" count={tk.watch_75} total={tk.views}/>
                <FunnelRow label="Completed" count={tk.watch_100} total={tk.views}/>
                <div style={{ display:"flex",gap:20,marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}` }}>
                  {[["Likes",tk.likes],["Shares",tk.shares],["Comments",tk.comments]].map(([l,v])=>(
                    <div key={l}><div style={{ fontSize:15,fontWeight:700 }}>{f.k(v)}</div><div style={{ fontSize:11,color:T.sub }}>{l}</div></div>
                  ))}
                </div>
              </Card>
            )}
            {gg && (
              <Card style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
                  <Pill platform="google"/>
                  <span style={{ fontSize:13,fontWeight:600 }}>Quality signals</span>
                </div>
                {(()=>{
                  const score=+gg.avg_quality_score;
                  const color=score>=7?T.green:score>=5?T.amber:T.red;
                  const pct=(score/10)*100;
                  return <>
                    <div style={{ fontSize:48,fontWeight:800,letterSpacing:"-0.04em",color,lineHeight:1 }}>{score.toFixed(1)}</div>
                    <div style={{ fontSize:12,color:T.sub,marginTop:3,marginBottom:10 }}>/10 quality score</div>
                    <div style={{ background:T.bg,borderRadius:4,height:5,marginBottom:5 }}>
                      <div style={{ background:color,height:"100%",borderRadius:4,width:pct+"%" }}/>
                    </div>
                    <div style={{ fontSize:11,color,marginBottom:14 }}>{score>=7?"Above benchmark":score>=5?"Near benchmark":"Below target — review ad relevance"}</div>
                  </>;
                })()}
                <Stat label="Impression share" value={f.pct(gg.avg_impression_share)}/>
                <Stat label="Avg CPC" value={f.$2(gg.avg_cpc)}/>
                <Stat label="ROAS" value={(+gg.roas).toFixed(2)+"x"}/>
                <Stat label="Conv. value" value={f.$(gg.total_conversion_value)}/>
              </Card>
            )}
            {fb && (
              <Card style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
                  <Pill platform="facebook"/>
                  <span style={{ fontSize:13,fontWeight:600 }}>Audience signals</span>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
                  {[["Reach",f.k(fb.total_reach),"unique"],["Video views",f.k(fb.total_video_views),"total"],["Engagement",f.pct(fb.avg_engagement_rate),"avg rate"],["Frequency",(+fb.avg_frequency).toFixed(2)+"x","impr/user"]].map(([l,v,s])=>(
                    <div key={l} style={{ background:T.bg,borderRadius:9,padding:"11px 13px" }}>
                      <div style={{ fontSize:10,color:T.sub,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4 }}>{l}</div>
                      <div style={{ fontSize:18,fontWeight:700,color:l==="Frequency"&&+fb.avg_frequency>3?T.amber:T.text }}>{v}</div>
                      <div style={{ fontSize:10,color:T.sub }}>{s}</div>
                    </div>
                  ))}
                </div>
                {+fb.avg_frequency>3&&(
                  <div style={{ background:T.amber+"14",border:`1px solid ${T.amber}30`,borderRadius:8,padding:"9px 12px",fontSize:12,color:"#92400E",lineHeight:1.5 }}>
                    Frequency {(+fb.avg_frequency).toFixed(1)}x — expand targeting or rotate creatives.
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Campaigns */}
          <Card>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:2 }}>Campaigns</div>
            <div style={{ fontSize:11,color:T.sub,marginBottom:18 }}>Top {(ca||[]).length} by spend · CPA in green = below average ({f.$2(ov.cpa)})</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:620 }}>
                <thead><tr>
                  {["Campaign","Platform","Spend","Impr.","Clicks","Conv.","CTR","CPA"].map(h=>(
                    <th key={h} style={{ textAlign:h==="Campaign"?"left":"right",color:T.sub,fontSize:10,paddingBottom:10,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(ca||[]).map((c,i)=>{
                    const good=+ov.cpa>0&&+c.cpa<+ov.cpa;
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:"10px 10px 10px 0",maxWidth:190,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500 }} title={c.campaign_name}>{c.campaign_name}</td>
                        <td style={{ textAlign:"right",padding:"10px 0" }}><Pill platform={c.platform}/></td>
                        <td style={{ textAlign:"right",padding:"10px 0",fontWeight:600 }}>{f.$(c.spend)}</td>
                        <td style={{ textAlign:"right",padding:"10px 0",color:T.sub }}>{f.k(c.impressions)}</td>
                        <td style={{ textAlign:"right",padding:"10px 0",color:T.sub }}>{f.k(c.clicks)}</td>
                        <td style={{ textAlign:"right",padding:"10px 0",fontWeight:600 }}>{f.n(c.conversions)}</td>
                        <td style={{ textAlign:"right",padding:"10px 0" }}>{f.pct(c.ctr)}</td>
                        <td style={{ textAlign:"right",padding:"10px 0",color:good?T.green:T.text,fontWeight:good?700:400 }}>{f.$2(c.cpa)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

        </main>
      </div>

      {/* Chat */}
      {chatOpen && (
        <aside style={{ width:320,background:T.card,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",height:"100vh",flexShrink:0 }}>
          <div style={{ padding:"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13,fontWeight:600 }}>AI Analyst</div>
              <div style={{ fontSize:11,color:ACCENT,marginTop:1 }}>Live · {days}d context</div>
            </div>
            <button onClick={()=>setChatOpen(false)} style={{ background:"transparent",border:"none",color:T.sub,display:"flex",padding:4 }}>{ICONS.close}</button>
          </div>
          <div style={{ flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10 }}>
            {msgs.map((m,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"88%",padding:"9px 13px",fontSize:12,lineHeight:1.6,whiteSpace:"pre-wrap",background:m.role==="user"?ACCENT:T.bg,color:m.role==="user"?"#fff":T.text,borderRadius:m.role==="user"?"12px 12px 3px 12px":"3px 12px 12px 12px" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy&&(
              <div style={{ display:"flex" }}>
                <div style={{ background:T.bg,borderRadius:"3px 12px 12px 12px",padding:"12px 14px",display:"flex",gap:4,alignItems:"center" }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:5,height:5,borderRadius:"50%",background:T.sub,animation:`pulse 1.2s ${i*.2}s ease-in-out infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <div style={{ padding:"0 12px 10px",display:"flex",flexWrap:"wrap",gap:5 }}>
            {["Best ROAS platform?","Scale recommendations","Budget reallocation","Flag underperformers"].map(q=>(
              <button key={q} onClick={()=>send(q)} style={{ background:ACCENT+"0f",border:`1px solid ${ACCENT}2a`,borderRadius:20,padding:"3px 9px",fontSize:10,color:ACCENT,fontWeight:500 }}>{q}</button>
            ))}
          </div>
          <div style={{ padding:"10px 12px 14px",borderTop:`1px solid ${T.border}`,display:"flex",gap:7 }}>
            <input ref={inpRef} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask about your campaigns…" style={{ flex:1,background:T.bg,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 13px",color:T.text,fontSize:12,fontFamily:"inherit" }}/>
            <button onClick={()=>send()} style={{ background:inp.trim()&&!busy?ACCENT:T.border,border:"none",borderRadius:9,width:38,display:"flex",alignItems:"center",justifyContent:"center",color:inp.trim()&&!busy?"#fff":T.sub,transition:"all .15s" }}>{ICONS.send}</button>
          </div>
        </aside>
      )}
    </div>
  );
}
