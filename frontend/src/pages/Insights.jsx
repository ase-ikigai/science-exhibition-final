import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Sparkles, TrendingUp, Compass, Heart, RefreshCw, ArrowRight } from "lucide-react";

export default function Insights() {
  const [d, setD] = useState(null);
  const [memory, setMemory] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loadingMem, setLoadingMem] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);

  const loadAll = async () => {
    const [a, b] = await Promise.all([
      client.get("/insights/overview"),
      client.get("/retention/weekly-card"),
    ]);
    setD(a.data); setWeekly(b.data);
  };

  useEffect(() => { loadAll(); }, []);

  const loadMemory = async () => {
    setLoadingMem(true);
    try {
      const { data } = await client.get("/memory/insights");
      setMemory(data);
    } finally { setLoadingMem(false); }
  };

  const loadComparison = async () => {
    setLoadingComp(true);
    try {
      const { data } = await client.get("/retention/monthly-comparison");
      setComparison(data);
    } finally { setLoadingComp(false); }
  };

  useEffect(() => { if (d && !memory && !loadingMem) loadMemory(); /* eslint-disable-next-line */ }, [d]);

  if (!d) return <Layout><div className="text-center text-[#7A6F66] py-20">Listening to your patterns…</div></Layout>;

  const trend = d.mood_trend || [];
  const maxM = Math.max(10, ...trend.map(t => t.mood));
  const W = 600, H = 160, P = 20;
  const pts = trend.map((t, i) => {
    const x = trend.length <= 1 ? W / 2 : P + (i * (W - 2*P)) / (trend.length - 1);
    const y = H - P - ((t.mood / maxM) * (H - 2*P));
    return `${x},${y}`;
  }).join(' ');
  // Area-fill polygon
  const polyArea = trend.length > 1
    ? `${P},${H - P} ${pts} ${P + (trend.length-1) * (W - 2*P) / (trend.length - 1)},${H - P}`
    : "";

  return (
    <Layout>
      <div className="max-w-5xl mx-auto" data-testid="insights-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Insights</p>
        <h1 className="font-serif text-5xl text-[#1F2A24] mb-3">Understand. Grow.</h1>
        <p className="text-[#1F2A24]/70 mb-8 leading-relaxed max-w-2xl">
          Patterns IKIGAI has noticed in your reflections, missions, and check-ins. Nothing here is judgement — only honest mirrors.
        </p>

        {/* Weekly card */}
        {weekly && (
          <div className="zen-card p-8 mb-6 animate-fade-up" data-testid="weekly-card"
               style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.35), rgba(255,247,233,0.45))" }}>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#B89668] mb-2">Your week</p>
            <p className="font-serif text-2xl text-[#1F2A24] italic leading-snug mb-5">"{weekly.headline}"</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MiniStat label="Avg mood" value={weekly.avg_mood ?? "—"}/>
              <MiniStat label="Mood dumps" value={weekly.moods}/>
              <MiniStat label="Journals" value={weekly.journals}/>
              <MiniStat label="Missions" value={weekly.missions}/>
              <MiniStat label="Blossoms" value={`+${weekly.blossoms_added}`} accent/>
            </div>
          </div>
        )}

        {/* Top stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Tile label="Avg mood" value={d.avg_mood ?? "—"} tid="ins-mood"/>
          <Tile label="Consistency" value={`${d.consistency_pct}%`} tid="ins-consistency"/>
          <Tile label="Missions" value={d.missions_completed} tid="ins-missions"/>
          <Tile label="Blossoms" value={d.blossoms} tid="ins-blossoms"/>
        </div>

        {/* AI memory patterns */}
        <div className="zen-card p-8 mb-6" data-testid="memory-card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3"/> AI Memory
              </p>
              <h3 className="font-serif text-2xl text-[#1F2A24]">What IKIGAI remembers</h3>
            </div>
            <button onClick={loadMemory} disabled={loadingMem}
                    className="btn-ghost text-xs inline-flex items-center gap-1.5 active:scale-95 transition-transform" data-testid="memory-refresh">
              <RefreshCw className={`w-3 h-3 ${loadingMem ? 'animate-spin' : ''}`}/> {loadingMem ? "Listening" : "Refresh"}
            </button>
          </div>

          {loadingMem && !memory && (
            <div className="space-y-2 animate-pulse" data-testid="memory-loading">
              <div className="h-3 w-3/4 bg-[#1F2A24]/8 rounded-full"/>
              <div className="h-3 w-2/3 bg-[#1F2A24]/8 rounded-full"/>
              <div className="h-3 w-1/2 bg-[#1F2A24]/8 rounded-full"/>
            </div>
          )}

          {memory && (
            <div>
              {memory.monthly_narrative && (
                <p className="font-serif text-lg text-[#1F2A24] italic leading-relaxed mb-5">
                  "{memory.monthly_narrative}"
                </p>
              )}
              {memory.patterns && memory.patterns.length > 0 && (
                <ul className="space-y-3 mb-5">
                  {memory.patterns.map((p, i) => (
                    <li key={i} className="flex gap-3" data-testid={`pattern-${i}`}>
                      <span className="w-7 h-7 rounded-full bg-[#E68AA1]/15 text-[#E68AA1] flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3" strokeWidth={1.75}/>
                      </span>
                      <div>
                        <p className="text-[#1F2A24] leading-snug">{p.observation}</p>
                        {p.warmth && <p className="text-sm text-[#7A6F66] italic mt-0.5">{p.warmth}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {memory.correlations && memory.correlations.length > 0 && (
                <div className="pt-5 border-t border-[#1F2A24]/8">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-3 flex items-center gap-1.5">
                    <Compass className="w-3 h-3"/> When you… then you…
                  </p>
                  <ul className="space-y-2">
                    {memory.correlations.map((c, i) => (
                      <li key={i} className="text-sm text-[#1F2A24]/85">
                        <span className="text-[#7AA37A] font-medium">{c.when}</span>
                        <span className="text-[#7A6F66] mx-2">→</span>
                        <span>{c.then}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(!memory.patterns || memory.patterns.length === 0) && !memory.monthly_narrative && (
                <p className="text-sm text-[#7A6F66]">
                  IKIGAI is still listening. Drop a mood, write a journal, and patterns will start to bloom here.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Monthly Comparison — "How life was" vs "How life is now" */}
        <div className="zen-card p-8 mb-6" data-testid="comparison-card"
             style={{ background: "linear-gradient(135deg, rgba(214,217,238,0.25), rgba(255,247,233,0.45))" }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1 flex items-center gap-1.5">
                <ArrowRight className="w-3 h-3"/> Then & Now
              </p>
              <h3 className="font-serif text-2xl text-[#1F2A24]">How life was vs how life is</h3>
            </div>
            <button onClick={loadComparison} disabled={loadingComp}
                    className="btn-ghost text-xs inline-flex items-center gap-1.5 active:scale-95 transition" data-testid="comparison-load">
              <RefreshCw className={`w-3 h-3 ${loadingComp ? "animate-spin" : ""}`}/> {loadingComp ? "Listening" : (comparison ? "Refresh" : "Reveal")}
            </button>
          </div>
          {!comparison ? (
            <p className="text-sm text-[#7A6F66] italic">Tap "Reveal" — IKIGAI will compare your starting words with where you are now.</p>
          ) : (
            <div>
              {comparison.narrative && (
                <p className="font-serif text-lg text-[#1F2A24] italic leading-relaxed mb-5">"{comparison.narrative}"</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="zen-card p-5 bg-white/60">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">When you began</p>
                  {comparison.baseline?.lifeNow ? (
                    <p className="text-sm text-[#1F2A24]/85 italic line-clamp-3">"{comparison.baseline.lifeNow}"</p>
                  ) : (<p className="text-sm text-[#7A6F66]">— no baseline note —</p>)}
                  {comparison.baseline?.energy && (
                    <DimRow label="Mood snapshot" dims={comparison.baseline.energy}/>
                  )}
                </div>
                <div className="zen-card p-5 bg-white/80">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#B89668] mb-2">Where you are now</p>
                  <p className="text-sm text-[#1F2A24]/85 mb-1">
                    Avg mood <span className="font-serif text-[#E68AA1] text-lg">{comparison.now?.overall_mood ?? "—"}</span>
                  </p>
                  {comparison.now?.dims && <DimRow label="Now" dims={comparison.now.dims}/>}
                  <p className="text-xs text-[#7A6F66] mt-2">
                    {comparison.totals?.moods} moods · {comparison.totals?.journals} journals · {comparison.totals?.blossoms} blossoms
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mood trend chart */}
        <div className="zen-card p-8 mb-6" data-testid="mood-chart">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3"/> Mood Trend
          </p>
          <h3 className="font-serif text-2xl mb-6 text-[#1F2A24]">Last {trend.length} days</h3>
          {trend.length === 0 ? (
            <div className="py-8 text-center">
              <Heart className="w-6 h-6 mx-auto text-[#E68AA1] mb-2" strokeWidth={1.5}/>
              <p className="text-[#7A6F66]">No check-ins yet. Mark today on the Home screen to begin.</p>
            </div>
          ) : (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
              <defs>
                <linearGradient id="moodFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F5D2DD" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#F5D2DD" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {polyArea && <polygon fill="url(#moodFill)" points={polyArea}/>}
              <polyline fill="none" stroke="#E68AA1" strokeWidth="2.5" points={pts} strokeLinejoin="round" strokeLinecap="round"/>
              {trend.map((t, i) => {
                const x = trend.length <= 1 ? W / 2 : P + (i * (W - 2*P)) / (trend.length - 1);
                const y = H - P - ((t.mood / maxM) * (H - 2*P));
                return <circle key={i} cx={x} cy={y} r="4" fill="#E68AA1"/>;
              })}
            </svg>
          )}
        </div>

        {/* Life area balance */}
        <div className="zen-card p-8" data-testid="areas-card">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1">Life Area Balance</p>
          <h3 className="font-serif text-2xl mb-5 text-[#1F2A24]">How your life is flowing</h3>
          {(d.area_avgs || []).length === 0 ? (
            <p className="text-[#7A6F66]">Add a few Life Map entries to see your balance.</p>
          ) : (
            <ul className="space-y-3">
              {d.area_avgs.map(a => (
                <li key={a.area} className="flex items-center gap-4">
                  <span className="w-24 font-serif text-[#1F2A24]">{a.area}</span>
                  <div className="flex-1 h-2 bg-[#EDE4D3] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#F5D2DD] to-[#E68AA1] transition-all duration-700"
                         style={{ width: `${(a.avg||0)*10}%` }}/>
                  </div>
                  <span className="text-sm text-[#7A6F66] w-20 text-right">{a.avg} · {a.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}

const Tile = ({ label, value, tid }) => (
  <div className="zen-card p-5" data-testid={tid}>
    <div className="font-serif text-3xl text-[#1F2A24]">{value}</div>
    <div className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mt-1">{label}</div>
  </div>
);

const MiniStat = ({ label, value, accent }) => (
  <div>
    <div className={`font-serif text-2xl ${accent ? 'text-[#E68AA1]' : 'text-[#1F2A24]'}`}>{value}</div>
    <div className="text-[9px] tracking-[0.25em] uppercase text-[#7A6F66] mt-0.5">{label}</div>
  </div>
);

const DimRow = ({ label, dims }) => {
  const keys = Object.keys(dims || {}).filter(k => dims[k] != null);
  if (keys.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[9px] tracking-[0.25em] uppercase text-[#7A6F66]">{label}</p>
      {keys.map(k => (
        <div key={k} className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#7A6F66] w-20 capitalize">{k}</span>
          <div className="flex-1 h-1 bg-[#1F2A24]/8 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F5D2DD] to-[#E68AA1]"
                 style={{ width: `${(dims[k]/10)*100}%` }}/>
          </div>
          <span className="text-[10px] tabular-nums text-[#1F2A24]/65 w-6 text-right">{dims[k]}</span>
        </div>
      ))}
    </div>
  );
};
