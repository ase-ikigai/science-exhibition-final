import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Heart, Moon, BookHeart, Sparkles, ShieldCheck, TrendingUp, TrendingDown, Minus, Activity, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ParentDashboard() {
  const [overview, setOverview] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);

  const load = async () => {
    setLoadError(null);
    try {
      const r = await client.get("/parent/overview");
      setOverview(r.data);
    } catch (e) {
      setLoadError(e?.response?.data?.detail || "Failed to load dashboard. Please refresh.");
    }
  };
  useEffect(() => { load(); }, []);

  const link = async () => {
    if (!code.trim()) return;
    setLinking(true);
    try {
      await client.post("/family/link", { code });
      toast.success("Connected 🌸");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Invalid code");
    } finally { setLinking(false); }
  };

  if (loadError) return (
    <Layout>
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-[#C46666] mb-4">{loadError}</p>
        <button onClick={load} className="btn-primary">Try again</button>
      </div>
    </Layout>
  );
  if (!overview) return <Layout><p className="text-[#8A7E82]">Loading…</p></Layout>;

  if (!overview.linked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto" data-testid="parent-link-form">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Parent Account</p>
          <h1 className="font-serif text-4xl mb-3">Connect with your teen</h1>
          <p className="text-[#2D1B22]/70 mb-8 leading-relaxed">
            Ask your teen for their 6-character Family Code from the Family tab in their IKIGAI app.
          </p>
          <div className="zen-card p-8">
            <input className="input-zen text-center font-serif text-3xl tracking-[0.3em] uppercase"
                   placeholder="······"
                   value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6}
                   data-testid="parent-code-input"/>
            <button onClick={link} disabled={linking || code.length !== 6} className="btn-primary w-full mt-5" data-testid="parent-link-btn">
              {linking ? "Connecting..." : "Connect"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const trend = overview.mood_trend || [];
  const max = Math.max(10, ...trend.map(t => t.mood));

  return (
    <Layout>
      <div className="max-w-5xl mx-auto" data-testid="parent-dashboard">
        <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Parent View · Privacy-first</p>
        <h1 className="font-serif text-5xl mb-2">{overview.teen_name}'s journey</h1>
        <p className="text-[#2D1B22]/70 mb-10 leading-relaxed">
          A gentle overview. You see trends — not their private words.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card icon={<Heart className="w-4 h-4"/>} label="Wellness" value={overview.wellbeing_score} tid="p-wellbeing"/>
          <Card icon={<Sparkles className="w-4 h-4"/>} label="Streak" value={`${overview.streak}d`} tid="p-streak"/>
          <Card icon={<Moon className="w-4 h-4"/>} label="Avg Mood (14d)" value={overview.avg_mood_14d ?? "—"} tid="p-avg-mood"/>
          <Card icon={<BookHeart className="w-4 h-4"/>} label="Reflections" value={overview.journal_count + overview.mood_dump_count} tid="p-reflections"/>
        </div>

        <div className="zen-card p-8 mb-6" data-testid="mood-trend-card">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Mood Trend</p>
          <h3 className="font-serif text-2xl mb-6">Last 14 days</h3>
          {trend.length === 0 ? (
            <p className="text-[#8A7E82]">No check-ins yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {[...trend].reverse().map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full rounded-t-xl transition-all duration-700"
                       style={{
                         height: `${(t.mood / max) * 100}%`,
                         background: "linear-gradient(180deg, #FFB7C5, #E68AA1)",
                         minHeight: 8,
                       }}/>
                  <span className="text-[10px] text-[#8A7E82]">{t.date.slice(-2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mental Behavior */}
        {overview.mental_behavior && (
          <div className="zen-card p-8 mb-6" data-testid="mental-behavior-card">
            <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Mental Behavior</p>
            <h3 className="font-serif text-2xl mb-6">How they're feeling</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <BehaviorMetric 
                icon={<Activity className="w-5 h-5" />}
                label="Stress Level"
                value={overview.mental_behavior.stress_avg}
                color="#B5B5DC"
              />
              <BehaviorMetric 
                icon={<Zap className="w-5 h-5" />}
                label="Energy"
                value={overview.mental_behavior.energy_avg}
                color="#7AA37A"
              />
              <BehaviorMetric 
                icon={<Sparkles className="w-5 h-5" />}
                label="Motivation"
                value={overview.mental_behavior.motivation_avg}
                color="#B89668"
              />
              <BehaviorMetric 
                icon={<ShieldCheck className="w-5 h-5" />}
                label="Confidence"
                value={overview.mental_behavior.confidence_avg}
                color="#D8A6A6"
              />
            </div>
          </div>
        )}

        {/* Weekly Report */}
        {overview.weekly_report && (
          <div className="zen-card p-8 mb-6" data-testid="weekly-report-card">
            <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Weekly Report</p>
            <h3 className="font-serif text-2xl mb-6">This week's progress</h3>
            <div className="space-y-5">
              {/* Trend */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50">
                <div>
                  <p className="text-sm text-[#8A7E82] mb-1">Mood Trend</p>
                  <p className="font-serif text-xl text-[#2D1B22]">
                    {overview.weekly_report.trend === 'improving' ? 'Improving 📈' :
                     overview.weekly_report.trend === 'declining' ? 'Needs support 📉' :
                     'Stable 〰️'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8A7E82]">This week vs last</p>
                  <p className="font-serif text-lg">
                    {overview.weekly_report.this_week_avg_mood ? 
                      `${overview.weekly_report.this_week_avg_mood} vs ${overview.weekly_report.last_week_avg_mood ?? 'N/A'}` : 
                      'No data'}
                  </p>
                </div>
              </div>

              {/* Activity */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-white/50 text-center">
                  <p className="text-2xl font-serif text-[#E68AA1] mb-1">{overview.weekly_report.checkins_this_week}</p>
                  <p className="text-xs text-[#8A7E82]">Check-ins</p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 text-center">
                  <p className="text-2xl font-serif text-[#B89668] mb-1">{overview.weekly_report.missions_completed}</p>
                  <p className="text-xs text-[#8A7E82]">Missions</p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 text-center">
                  <p className="text-2xl font-serif text-[#7AA37A] mb-1">{overview.weekly_report.reflections}</p>
                  <p className="text-xs text-[#8A7E82]">Reflections</p>
                </div>
              </div>

              <p className="text-sm text-[#8A7E82] italic mt-4 p-3 rounded-lg bg-[#8A7E82]/5">
                Your teen is actively engaging with their growth practice. Consistent engagement like this is what builds lasting change.
              </p>
            </div>
          </div>
        )}

        <div className="zen-card p-8" data-testid="privacy-banner">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                 style={{ background: "rgba(212,224,209,0.5)" }}>
              <ShieldCheck className="w-5 h-5 text-[#7AA37A]" strokeWidth={1.5}/>
            </div>
            <div>
              <h3 className="font-serif text-xl mb-1">Their inner world is theirs</h3>
              <p className="text-sm text-[#2D1B22]/70 leading-relaxed">
                Journal entries, mood dumps, and AI coach conversations are private. You see trends and patterns —
                so you can show up with the right kind of presence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const Card = ({ icon, label, value, tid }) => (
  <div className="zen-card p-5" data-testid={tid}>
    <div className="text-[#E68AA1] mb-2">{icon}</div>
    <div className="font-serif text-3xl text-[#2D1B22]">{value}</div>
    <div className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mt-1">{label}</div>
  </div>
);

const BehaviorMetric = ({ icon, label, value, color }) => (
  <div className="zen-card p-5">
    <div className="mb-2" style={{ color }}>{icon}</div>
    <div className="font-serif text-2xl text-[#2D1B22]" style={{ color }}>
      {value ?? "—"}
    </div>
    <div className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mt-1">{label}</div>
  </div>
);
