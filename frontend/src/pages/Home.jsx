import React, { useEffect, useRef, useState } from "react";
import { Layout } from "../components/Layout";
import { SakuraTree, STAGES, TreeStageLabel } from "../components/SakuraTree";
import { useAuth } from "../context/AuthContext";
import client from "../lib/api";
import { Link } from "react-router-dom";
import {
  BookHeart, PenLine, Compass, Map, Sparkles, ArrowRight, Bookmark, Heart,
  Flower2, Smile, Wind, Zap, BatteryFull, Shield, Cloud, Loader2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const MOOD_DIMS = [
  { key: "happiness", label: "Happiness", icon: Smile, color: "#E68AA1" },
  { key: "stress",    label: "Stress",    icon: Cloud,  color: "#B5B5DC" },
  { key: "motivation",label: "Motivation",icon: Zap,    color: "#B89668" },
  { key: "energy",    label: "Energy",    icon: BatteryFull, color: "#7AA37A" },
  { key: "confidence",label: "Confidence",icon: Shield, color: "#D8A6A6" },
  { key: "calmness",  label: "Calmness",  icon: Wind,   color: "#9DBCB1" },
];

export default function Home() {
  const { user } = useAuth();
  const [tree, setTree] = useState({ stage: "seed", blossom_count: 0, growth_score: 0, resting: false });
  const [displayStage, setDisplayStage] = useState("seed");
  const [snapshot, setSnapshot] = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [dims, setDims] = useState({ happiness: 5, stress: 5, motivation: 5, energy: 5, confidence: 5, calmness: 5 });
  const [morningMood, setMorningMood] = useState(null);
  const [nightMood, setNightMood] = useState(null);
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [savingMorningMood, setSavingMorningMood] = useState(false);
  const [savingNightMood, setSavingNightMood] = useState(false);
  const [celebrating, setCelebrating] = useState(null);
  const [progressQuote, setProgressQuote] = useState(null);
  const [tinyHabit, setTinyHabit] = useState(null);
  const [tinyHabitMood, setTinyHabitMood] = useState(null);
  const [loadingTiny, setLoadingTiny] = useState(false);
  const prevStageRef = useRef(null);

  const stageNarratives = {
    seed: "A seed has been planted",
    sprout: "A tiny sprout is emerging",
    seedling: "A small sapling is taking root",
    growing: "Thin branches arc outward",
    mature: "A mature green tree stands steady",
    blooming: "Blossoms are beginning to appear",
    radiant: "Your radiant cherry blossom tree is here",
  };

  const refreshState = async () => {
    const [t, s, c, q] = await Promise.all([
      client.get("/tree/state").catch(() => null),
      client.get("/home/snapshot").catch(() => null),
      client.get("/checkin/today").catch(() => null),
      client.get("/quotes/progress").catch(() => null),
    ]);
    if (t?.data) setTree(t.data);
    if (s?.data) setSnapshot(s.data);
    if (c?.data) {
      setTodayCheckin(c.data.checkin);
      if (c.data.checkin?.dims) {
        setDims(prev => ({ ...prev, ...c.data.checkin.dims }));
      }
      if (c.data.checkin?.morning_mood) setMorningMood(c.data.checkin.morning_mood);
      if (c.data.checkin?.night_mood) setNightMood(c.data.checkin.night_mood);
    }
    if (q?.data) setProgressQuote(q.data);
    if (t?.data) prevStageRef.current = t.data.stage;
  };

  const fetchTinyHabit = async (mood) => {
    setLoadingTiny(true);
    setTinyHabitMood(mood);
    try {
      const { data } = await client.post("/tiny-habit", { mood });
      setTinyHabit(data);
    } catch {
      toast.error("Couldn't fetch a tiny habit");
    } finally { setLoadingTiny(false); }
  };

  useEffect(() => { refreshState(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!tree) return;

    const targetIndex = STAGES.indexOf(tree.stage);
    if (targetIndex < 0) return;

    const seedlingIndex = STAGES.indexOf("seedling");
    const startIndex = targetIndex >= seedlingIndex ? seedlingIndex : targetIndex;
    const stages = STAGES.slice(startIndex, targetIndex + 1);

    let timeoutIds = [];
    const stepDelay = 350;

    stages.forEach((stage, index) => {
      const timeoutId = window.setTimeout(() => {
        setDisplayStage(stage);
      }, index * stepDelay);
      timeoutIds.push(timeoutId);
    });

    return () => timeoutIds.forEach(id => window.clearTimeout(id));
  }, [tree.stage]);

  useEffect(() => {
    if (prevStageRef.current && prevStageRef.current !== tree.stage) {
      setCelebrating(tree.stage);
      setTimeout(() => setCelebrating(null), 5000);
    }
    prevStageRef.current = tree.stage;
  }, [tree.stage]);

  const submitCheckin = async () => {
    setSavingCheckin(true);
    try {
      await client.post("/checkin", dims);
      await refreshState();
      toast.success("Today is noted 🌸");
    } catch { toast.error("Couldn't save"); }
    finally { setSavingCheckin(false); }
  };

  const submitMorningMood = async (mood) => {
    setSavingMorningMood(true);
    try {
      await client.post("/checkin", { ...dims, morning_mood: mood });
      setMorningMood(mood);
      toast.success("Morning noted 🌅");
    } catch { toast.error("Couldn't save"); }
    finally { setSavingMorningMood(false); }
  };

  const submitNightMood = async (mood) => {
    setSavingNightMood(true);
    try {
      await client.post("/checkin", { ...dims, night_mood: mood });
      setNightMood(mood);
      toast.success("Night noted 🌙");
    } catch { toast.error("Couldn't save"); }
    finally { setSavingNightMood(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const quickActions = [
    { to: "/mood", icon: BookHeart, title: "Mood Dump", subtitle: "Let it spill", tid: "qa-mood" },
    { to: "/solve", icon: Compass, title: "Solve", subtitle: "A gentle path", tid: "qa-solve" },
    { to: "/keep-going", icon: Heart, title: "Keep Going", subtitle: "When you want to quit", tid: "qa-keep-going" },
    { to: "/plan", icon: Map, title: "Your Plan", subtitle: "Personal roadmap", tid: "qa-plan" },
    { to: "/journal", icon: PenLine, title: "Journal", subtitle: "Guided prompts", tid: "qa-journal" },
    { to: "/missions", icon: Sparkles, title: "Missions", subtitle: "Today's small acts", tid: "qa-missions" },
  ];

  // Spark
  const trend = snapshot?.week?.trend || [];
  const W = 240, H = 50, P = 5;
  const sparkPoints = trend.map((t, i) => {
    const x = trend.length <= 1 ? W / 2 : P + (i * (W - 2*P)) / (trend.length - 1);
    const y = H - P - ((t.mood / 10) * (H - 2*P));
    return `${x},${y}`;
  }).join(" ");

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7" data-testid="home-page">
        {/* Greeting */}
        <div className="lg:col-span-7 zen-card p-9" data-testid="greeting-card">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-3">A new petal</p>
          <h1 className="font-serif text-4xl lg:text-5xl tracking-tight text-[#1F2A24]">
            {greeting},
          </h1>
          <h2 className="font-serif italic text-4xl lg:text-5xl text-[#E68AA1] mt-1">
            {user?.name}
          </h2>
          {snapshot?.encouragement && (
            <div className="mt-6 pt-6 border-t border-[#1F2A24]/8 animate-fade-up" data-testid="ai-encouragement">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#B89668] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3"/> A note from IKIGAI
              </p>
              <p className="font-serif text-xl italic text-[#1F2A24] leading-relaxed">
                "{snapshot.encouragement}"
              </p>
            </div>
          )}
          {progressQuote?.quote && (
            <div className="mt-5 animate-fade-up" data-testid="progress-quote">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1.5">
                For where you are · {progressQuote.blossoms} {progressQuote.blossoms === 1 ? "blossom" : "blossoms"}
              </p>
              <p className="font-serif italic text-base text-[#E68AA1] leading-snug">{progressQuote.quote}</p>
            </div>
          )}
        </div>

        {/* Continue card */}
        <div className="lg:col-span-5 zen-card p-7" data-testid="reflection-card"
             style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.35), rgba(250,247,241,0.85))" }}>
          {snapshot?.continue ? (
            <>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3 h-3"/> Continue where you left off
              </p>
              <p className="font-serif text-2xl text-[#1F2A24] leading-snug mb-2">
                {snapshot.continue.label}
              </p>
              {snapshot.continue.hint && (
                <p className="text-sm text-[#7A6F66] italic mb-5 line-clamp-2">"{snapshot.continue.hint}"</p>
              )}
              <Link to={snapshot.continue.path} className="btn-primary inline-flex items-center gap-2 active:scale-95 transition" data-testid="continue-cta">
                Continue <ArrowRight className="w-3.5 h-3.5"/>
              </Link>
            </>
          ) : (
            <>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Today's reflection</p>
              <p className="font-serif text-2xl text-[#1F2A24] leading-snug mb-5">
                Please start to see something — your first reflection sets the tone.
              </p>
              <Link to="/mood" className="btn-primary inline-flex items-center gap-2 active:scale-95 transition" data-testid="reflect-cta">
                Open Mood Dump <ArrowRight className="w-3.5 h-3.5"/>
              </Link>
            </>
          )}
        </div>

        {/* Tree */}
        <div className="lg:col-span-7 zen-card overflow-hidden relative" style={{ minHeight: 480 }} data-testid="home-tree-card">
          <div className="absolute top-6 left-7 z-10 max-w-[60%]">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1">Your Growth Tree</p>
            <h3 className="font-serif text-3xl text-[#1F2A24]">
              <TreeStageLabel stage={tree.stage}/>
            </h3>
            <p className="text-xs text-[#7A6F66] mt-1 font-serif italic">
              {tree.blossom_count} {tree.blossom_count === 1 ? "blossom" : "blossoms"} · {tree.resting ? "your tree is resting" : stageNarratives[tree.stage] || "growing softly"}
            </p>
            {tree.next_stage_at != null && (
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] mt-3" data-testid="next-stage-hint">
                Next stage at {tree.next_stage_at} blossoms · {tree.next_stage_at - tree.blossom_count} to go
              </p>
            )}
            <Link to="/garden" className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] hover:text-[#1F2A24] inline-flex items-center gap-1 mt-3 transition" data-testid="tree-timeline-link">
              See your timeline <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>
          <SakuraTree stage={displayStage} blossoms={tree.blossom_count} resting={tree.resting} useLegacyImage={displayStage === "radiant"} className="w-full h-full"/>

          {celebrating && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center animate-fade-up" data-testid="stage-celebration">
              <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(255,220,140,0.35) 0%, transparent 60%)" }}/>
              {Array.from({ length: 24 }).map((_, i) => {
                const left = 8 + ((i * 37) % 84);
                const top = 8 + ((i * 53) % 84);
                return (
                  <span key={i} className="absolute rounded-full"
                        style={{
                          left: `${left}%`, top: `${top}%`, width: 10, height: 10,
                          background: "radial-gradient(circle, #FFE9A8 0%, #B89668 60%, transparent 80%)",
                          boxShadow: "0 0 22px rgba(255,220,140,1)",
                          animation: `firefly ${3 + (i%3)}s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                        }}/>
                );
              })}
              <div className="relative text-center px-6 py-5 rounded-3xl"
                   style={{ background: "rgba(250,247,241,0.94)", backdropFilter: "blur(20px)", border: "1px solid rgba(184,150,104,0.3)", boxShadow: "0 12px 40px rgba(184,150,104,0.3)" }}>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#B89668] mb-1">A new chapter</p>
                <p className="font-serif text-2xl text-[#1F2A24] italic">{stageNarratives[celebrating]} 🌸</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column: 6-dim mood + week */}
        <div className="lg:col-span-5 space-y-5">
          {/* Morning & Night Mood Quick Check */}
          <div className="grid grid-cols-2 gap-3">
            {/* Morning Mood */}
            <div className="zen-card p-5" data-testid="morning-mood-card">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mb-2">Morning</p>
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-serif text-xl text-[#1F2A24]">🌅</p>
                {morningMood && <span className="font-serif text-lg" style={{ color: "#FFB347" }}>{morningMood}</span>}
              </div>
              <input 
                type="range" 
                min={1} 
                max={10} 
                value={morningMood || 5}
                onChange={e => submitMorningMood(Number(e.target.value))}
                disabled={savingMorningMood}
                className="w-full"
                style={{ accentColor: "#FFB347" }}
                data-testid="morning-mood-slider"
              />
              <p className="text-[10px] text-[#7A6F66] mt-2">How did you wake?</p>
            </div>

            {/* Night Mood */}
            <div className="zen-card p-5" data-testid="night-mood-card">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mb-2">Night</p>
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-serif text-xl text-[#1F2A24]">🌙</p>
                {nightMood && <span className="font-serif text-lg" style={{ color: "#7DD3FC" }}>{nightMood}</span>}
              </div>
              <input 
                type="range" 
                min={1} 
                max={10} 
                value={nightMood || 5}
                onChange={e => submitNightMood(Number(e.target.value))}
                disabled={savingNightMood}
                className="w-full"
                style={{ accentColor: "#7DD3FC" }}
                data-testid="night-mood-slider"
              />
              <p className="text-[10px] text-[#7A6F66] mt-2">Winding down?</p>
            </div>
          </div>

          <div className="zen-card p-7" data-testid="checkin-card">
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66]">
                {todayCheckin ? "How today felt" : "How are you, today?"}
              </p>
              {todayCheckin && (
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#B89668]">noted</span>
              )}
            </div>
            <h3 className="font-serif text-2xl text-[#1F2A24] mb-5">
              {todayCheckin ? "Adjust if you'd like" : "Slide each one — gut feeling"}
            </h3>

            <div className="space-y-4" data-testid="checkin-dims">
              {MOOD_DIMS.map(({ key, label, icon: Icon, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-2 text-sm text-[#1F2A24]/85">
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color }}/> {label}
                    </span>
                    <span className="font-serif text-base" style={{ color }}>{dims[key]}</span>
                  </div>
                  <input type="range" min={1} max={10} value={dims[key]}
                         onChange={e => setDims({ ...dims, [key]: Number(e.target.value) })}
                         className="w-full"
                         style={{ accentColor: color }}
                         data-testid={`dim-${key}`}/>
                </div>
              ))}
            </div>

            <button onClick={submitCheckin} disabled={savingCheckin}
                    className="btn-primary w-full mt-5 active:scale-95 transition" data-testid="checkin-submit">
              {savingCheckin ? "Noting…" : (todayCheckin ? "Update today" : "Mark today")}
            </button>
          </div>

          {/* Week */}
          {snapshot?.week && (
            <div className="zen-card p-6" data-testid="growth-summary-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66]">This week</p>
                <Link to="/insights" className="text-[10px] tracking-[0.2em] uppercase text-[#B89668] hover:text-[#1F2A24] transition inline-flex items-center gap-1" data-testid="week-insights-link">
                  Insights <ArrowRight className="w-3 h-3"/>
                </Link>
              </div>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <div className="font-serif text-3xl text-[#1F2A24]">{snapshot.week.checkins}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#7A6F66] mt-0.5">Check-ins</div>
                </div>
                <div>
                  <div className="font-serif text-3xl text-[#1F2A24]">{snapshot.week.avg_mood ?? "—"}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#7A6F66] mt-0.5">Avg mood</div>
                </div>
                <div>
                  <div className="font-serif text-3xl text-[#E68AA1]">+{snapshot.week.blossoms}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase text-[#7A6F66] mt-0.5">Blossoms</div>
                </div>
              </div>
              {trend.length > 1 && (
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12 mt-3">
                  <defs>
                    <linearGradient id="spark" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#F5D2DD"/><stop offset="100%" stopColor="#E68AA1"/>
                    </linearGradient>
                  </defs>
                  <polyline fill="none" stroke="url(#spark)" strokeWidth="2.2" points={sparkPoints} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Tiny Habit — in-the-moment help */}
        <div className="lg:col-span-12 zen-card p-7" data-testid="tiny-habit-card"
             style={{ background: "linear-gradient(135deg, rgba(214,217,238,0.25), rgba(255,247,233,0.5))" }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1 flex items-center gap-1.5">
                <Heart className="w-3 h-3"/> Feeling stuck?
              </p>
              <h3 className="font-serif text-2xl text-[#1F2A24]">A tiny habit, calibrated to right now</h3>
            </div>
            {tinyHabit && (
              <button onClick={() => fetchTinyHabit(tinyHabitMood || "stuck")} disabled={loadingTiny}
                      className="btn-ghost text-xs inline-flex items-center gap-1.5 active:scale-95 transition" data-testid="tiny-refresh">
                <RefreshCw className={`w-3 h-3 ${loadingTiny ? "animate-spin" : ""}`}/> Another one
              </button>
            )}
          </div>

          {!tinyHabit && !loadingTiny && (
            <>
              <p className="text-sm text-[#1F2A24]/75 mb-4">Tap how you're feeling — IKIGAI will suggest one micro-action under 2 minutes:</p>
              <div className="flex flex-wrap gap-2" data-testid="tiny-mood-chips">
                {[
                  { id: "down", label: "Down" },
                  { id: "unmotivated", label: "Unmotivated" },
                  { id: "anxious", label: "Anxious" },
                  { id: "stuck", label: "Stuck" },
                  { id: "overwhelmed", label: "Overwhelmed" },
                ].map(c => (
                  <button key={c.id} type="button" onClick={() => fetchTinyHabit(c.id)} data-testid={`tiny-${c.id}`}
                          className="px-4 py-2 rounded-full text-sm border bg-white/70 border-[#1F2A24]/12 text-[#1F2A24]/85 hover:border-[#E68AA1]/60 hover:bg-white transition active:scale-95">
                    {c.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {loadingTiny && (
            <div className="flex items-center gap-2 text-sm text-[#7A6F66]" data-testid="tiny-loading">
              <Loader2 className="w-3.5 h-3.5 animate-spin"/> Reaching for the smallest step…
            </div>
          )}

          {tinyHabit && (
            <div className="animate-fade-up" data-testid="tiny-habit-result">
              <p className="font-serif text-2xl text-[#1F2A24] leading-snug mb-2">"{tinyHabit.habit}"</p>
              {tinyHabit.why && (
                <p className="text-sm text-[#1F2A24]/75 leading-relaxed mb-2">{tinyHabit.why}</p>
              )}
              {tinyHabit.link_to_goal && (
                <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668]">
                  → {tinyHabit.link_to_goal}
                </p>
              )}
              <button onClick={() => { setTinyHabit(null); setTinyHabitMood(null); }}
                      className="mt-4 text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] hover:text-[#1F2A24] transition" data-testid="tiny-reset">
                pick another feeling
              </button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-12">
          <p className="font-serif text-2xl text-[#1F2A24] mb-5">What would you like to do?</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map(qa => (
              <Link key={qa.tid} to={qa.to} data-testid={qa.tid}
                    className="zen-card p-6 flex items-center gap-4 hover:-translate-y-0.5 active:translate-y-0 transition group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition"
                     style={{ background: "rgba(245,210,221,0.5)", color: "#1F2A24" }}>
                  <qa.icon className="w-5 h-5" strokeWidth={1.5}/>
                </div>
                <div className="flex-1">
                  <div className="font-serif text-lg text-[#1F2A24]">{qa.title}</div>
                  <div className="text-[10px] tracking-[0.15em] uppercase text-[#7A6F66] mt-0.5">{qa.subtitle}</div>
                </div>
                <span className="text-[#E68AA1] group-hover:translate-x-1 transition">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
