import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles, Zap, Wind, Leaf } from "lucide-react";
import client from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const GOAL_OPTIONS = [
  "Better grades", "Better sleep", "Confidence", "Fitness",
  "Reduce screen time", "Mental health", "Social skills", "Sports",
  "Productivity", "Creativity",
];

const ENERGY_DIMS = [
  { key: "happiness", label: "Happiness" },
  { key: "stress", label: "Stress" },
  { key: "motivation", label: "Motivation" },
  { key: "energy", label: "Energy" },
  { key: "confidence", label: "Confidence" },
  { key: "calmness", label: "Calmness" },
];

const PACES = [
  {
    id: "fast", weeks: 2, title: "Fast-Paced Growth", icon: Zap,
    color: "#E68AA1", bg: "linear-gradient(135deg, rgba(245,210,221,0.55), rgba(255,247,233,0.6))",
    points: ["More daily missions", "Frequent check-ins", "Stronger momentum", "Faster progress"],
    for: "For when you're ready to move quickly.",
  },
  {
    id: "balanced", weeks: 4, title: "Balanced Growth", icon: Leaf,
    color: "#7AA37A", bg: "linear-gradient(135deg, rgba(220,234,210,0.55), rgba(255,247,233,0.6))",
    points: ["Moderate pace", "Sustainable habits", "Healthy consistency", "Recommended"],
    for: "For most people, most of the time.",
    recommended: true,
  },
  {
    id: "gentle", weeks: 8, title: "Gentle Growth", icon: Wind,
    color: "#B5B5DC", bg: "linear-gradient(135deg, rgba(214,217,238,0.45), rgba(255,247,233,0.6))",
    points: ["Small daily actions", "Lowest pressure", "Easiest to maintain", "Calm and gradual"],
    for: "For when slow & steady is what you need.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    age: "", grade: "", gender: "", country: "",
    lifeNow: "", oneMonthVision: "",
    hardest: "", wishDifferent: "", timeSpent: "",
    feeling: "", stressors: "", repeatingThoughts: "",
    growthPace: "balanced",
    goals: [],
    energy: { happiness: 5, stress: 5, motivation: 5, energy: 5, confidence: 5, calmness: 5 },
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPlanSplash, setShowPlanSplash] = useState(false);
  const [planSummary, setPlanSummary] = useState("");

  const steps = [
    {
      title: "A gentle hello", subtitle: "Just a few basics to begin",
      render: () => (
        <div className="space-y-3">
          <input className="input-zen" placeholder="Age" value={data.age}
                 onChange={e => setData({ ...data, age: e.target.value })} type="number" data-testid="onb-age"/>
          <input className="input-zen" placeholder="Grade" value={data.grade}
                 onChange={e => setData({ ...data, grade: e.target.value })} data-testid="onb-grade"/>
          <input className="input-zen" placeholder="Gender (optional)" value={data.gender}
                 onChange={e => setData({ ...data, gender: e.target.value })} data-testid="onb-gender"/>
          <input className="input-zen" placeholder="Country" value={data.country}
                 onChange={e => setData({ ...data, country: e.target.value })} data-testid="onb-country"/>
        </div>
      ),
    },
    {
      title: "How's life right now?", subtitle: "Be as honest as you'd like — only IKIGAI sees this.",
      render: () => (
        <div>
          <textarea className="input-zen min-h-[200px] font-serif text-base leading-relaxed"
                    placeholder="What's going on. What's bothering you. What's making you happy. Your current situation. Anything you want IKIGAI to understand…"
                    value={data.lifeNow} onChange={e => setData({ ...data, lifeNow: e.target.value })}
                    data-testid="onb-life-now"/>
          <p className="text-xs text-[#7A6F66] mt-2 italic">
            The more you share, the more personally IKIGAI can guide you.
          </p>
        </div>
      ),
    },
    {
      title: "How do you want life to be in one month?", subtitle: "Your ideal version — paint it freely.",
      render: () => (
        <div>
          <textarea className="input-zen min-h-[200px] font-serif text-base leading-relaxed"
                    placeholder="Your ideal life. Habits you'd love. Mood you'd love. Confidence. Relationships. Productivity. Lifestyle…"
                    value={data.oneMonthVision} onChange={e => setData({ ...data, oneMonthVision: e.target.value })}
                    data-testid="onb-vision"/>
          <p className="text-xs text-[#7A6F66] mt-2 italic">
            IKIGAI will reflect this back to you in monthly reports.
          </p>
        </div>
      ),
    },
    {
      title: "Choose your growth pace", subtitle: "You can change this later, anytime.",
      render: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="onb-pace-grid">
          {PACES.map(p => {
            const active = data.growthPace === p.id;
            const Icon = p.icon;
            return (
              <button key={p.id} type="button" onClick={() => setData({ ...data, growthPace: p.id })}
                      className={`zen-card p-6 text-left transition-all active:scale-95 hover:-translate-y-0.5 ${
                        active ? "ring-2 shadow-xl" : "opacity-95"
                      }`}
                      style={{
                        background: p.bg,
                        ringColor: active ? p.color : "transparent",
                        boxShadow: active ? `0 12px 32px ${p.color}40` : undefined,
                        borderColor: active ? p.color : undefined,
                      }}
                      data-testid={`pace-${p.id}`}>
                {p.recommended && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] tracking-[0.2em] uppercase text-white mb-3"
                        style={{ background: p.color }}>recommended</span>
                )}
                <Icon className="w-5 h-5 mb-3" style={{ color: p.color }} strokeWidth={1.5}/>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1">{p.weeks} weeks</p>
                <h3 className="font-serif text-xl text-[#1F2A24] mb-3">{p.title}</h3>
                <ul className="space-y-1.5 text-sm text-[#1F2A24]/80 mb-4">
                  {p.points.map((pt, i) => (
                    <li key={i} className="flex gap-2">
                      <span style={{ color: p.color }}>·</span>{pt}
                    </li>
                  ))}
                </ul>
                <p className="text-xs italic text-[#7A6F66]">{p.for}</p>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "What feels hardest", subtitle: "Optional — but it helps personalize your plan.",
      render: () => (
        <div className="space-y-3">
          <textarea className="input-zen min-h-[80px]" placeholder="What feels hardest right now?"
                    value={data.hardest} onChange={e => setData({ ...data, hardest: e.target.value })}
                    data-testid="onb-hardest"/>
          <textarea className="input-zen min-h-[80px]" placeholder="What's been stressing you out recently?"
                    value={data.stressors} onChange={e => setData({ ...data, stressors: e.target.value })}
                    data-testid="onb-stress"/>
          <textarea className="input-zen min-h-[80px]" placeholder="What thoughts keep repeating?"
                    value={data.repeatingThoughts} onChange={e => setData({ ...data, repeatingThoughts: e.target.value })}
                    data-testid="onb-thoughts"/>
        </div>
      ),
    },
    {
      title: "What matters to you", subtitle: "Pick any that feel true",
      render: () => (
        <div data-testid="onb-goals">
          <div className="flex flex-wrap gap-2 mb-4">
            {GOAL_OPTIONS.map(g => {
              const active = data.goals.includes(g);
              return (
                <button key={g} type="button" onClick={() => {
                  setData({ ...data, goals: active ? data.goals.filter(x => x !== g) : [...data.goals, g] });
                }}
                  className={`px-4 py-2 rounded-full text-sm border transition active:scale-95 ${
                    active ? "bg-[#E68AA1] text-white border-[#E68AA1]" : "bg-white/50 border-[#E68AA1]/20 text-[#1F2A24]/80 hover:border-[#E68AA1]/50"
                  }`}>{g}</button>
              );
            })}
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mb-2">Add your own (Enter)</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.goals.filter(g => !GOAL_OPTIONS.includes(g)).map((g, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-sm bg-[#E68AA1] text-white inline-flex items-center gap-2">
                {g}
                <button type="button" onClick={() => setData({ ...data, goals: data.goals.filter(x => x !== g) })}
                        className="opacity-80 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
          <input className="input-zen" placeholder="e.g. learn piano" data-testid="onb-goal-other"
                 onKeyDown={e => {
                   if (e.key === "Enter" && e.target.value.trim()) {
                     e.preventDefault();
                     const v = e.target.value.trim();
                     if (!data.goals.includes(v)) setData({ ...data, goals: [...data.goals, v] });
                     e.target.value = "";
                   }
                 }}/>
        </div>
      ),
    },
    {
      title: "Your energy today", subtitle: "Slide each — gut feeling",
      render: () => (
        <div className="space-y-5">
          {ENERGY_DIMS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-[#1F2A24]/85">{label}</span>
                <span className="text-[#E68AA1] font-medium">{data.energy[key]}</span>
              </div>
              <input type="range" min={1} max={10} value={data.energy[key]}
                     onChange={e => setData({ ...data, energy: { ...data.energy, [key]: Number(e.target.value) } })}
                     data-testid={`onb-energy-${key}`} className="w-full accent-[#E68AA1]"/>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const submit = async () => {
    setSubmitting(true);
    // Show splash immediately so the user feels the magic happening
    setShowPlanSplash(true);
    try {
      await client.post("/onboarding", {
        age: Number(data.age) || null,
        grade: data.grade, gender: data.gender, country: data.country,
        lifeNow: data.lifeNow, oneMonthVision: data.oneMonthVision,
        hardest: data.hardest, wishDifferent: data.wishDifferent, timeSpent: data.timeSpent,
        feeling: data.feeling, stressors: data.stressors, repeatingThoughts: data.repeatingThoughts,
        growthPace: data.growthPace,
        goals: data.goals, energy: data.energy,
      });
      const { data: planResp } = await client.post("/plan/generate");
      setPlanSummary(planResp?.plan?.summary || "");
      // Hold the splash a moment so it FEELS like creation
      await new Promise(r => setTimeout(r, 1800));
      await refreshMe();
      navigate("/home");
    } catch (e) {
      setShowPlanSplash(false);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const current = steps[step];
  const isLast = step === steps.length - 1;

  if (showPlanSplash) {
    return <PlanSplashScreen summary={planSummary}/>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-[#E68AA1]" strokeWidth={1.5}/>
          <span className="font-serif text-sm tracking-[0.4em] text-[#1F2A24]">IKIGAI</span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-10 max-w-2xl mx-auto">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-700 ${
              i <= step ? "bg-[#E68AA1]" : "bg-[#E68AA1]/15"
            }`}/>
          ))}
        </div>

        <div className="zen-card p-8 sm:p-12 animate-fade-up" key={step}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#E68AA1]" strokeWidth={1.5}/>
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66]">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1F2A24] mb-2" data-testid="onb-title">
            {current.title}
          </h2>
          <p className="text-[#7A6F66] mb-8">{current.subtitle}</p>

          {current.render()}

          <div className="flex items-center justify-between mt-10">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                    className="btn-ghost disabled:opacity-30 inline-flex items-center gap-2 active:scale-95 transition"
                    data-testid="onb-back">
              <ArrowLeft className="w-3.5 h-3.5"/> Back
            </button>
            {isLast ? (
              <button onClick={submit} disabled={submitting}
                      className="btn-primary inline-flex items-center gap-2 active:scale-95 transition"
                      data-testid="onb-submit">
                {submitting ? "Planting your sanctuary…" : <>Begin <ArrowRight className="w-3.5 h-3.5"/></>}
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)}
                      className="btn-primary inline-flex items-center gap-2 active:scale-95 transition"
                      data-testid="onb-next">
                Next <ArrowRight className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const PlanSplashScreen = ({ summary }) => (
  <div className="min-h-screen relative flex items-center justify-center px-6 overflow-hidden"
       style={{ background: "var(--ikigai-bg)" }} data-testid="plan-splash">
    {/* Animated petals */}
    {Array.from({ length: 22 }).map((_, i) => {
      const left = (i * 53) % 100;
      const dur = 9 + (i % 5) * 2;
      return (
        <span key={i} className="petal" style={{
          left: `${left}%`, top: "-5%",
          animation: `petal-fall ${dur}s linear ${(i * 0.4) % 8}s infinite`,
        }}/>
      );
    })}

    <div className="relative text-center max-w-xl animate-fade-up">
      {/* Brand */}
      <div className="flex items-center justify-center gap-2.5 mb-10">
        <span className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F5D2DD, #E68AA1)", boxShadow: "0 0 30px rgba(230,138,161,0.4)" }}>
          <Sparkles className="w-4 h-4 text-white" strokeWidth={2}/>
        </span>
        <span className="font-serif text-2xl tracking-[0.45em] text-[#1F2A24]">IKIGAI</span>
      </div>

      {/* Sakura icon (CSS bloom) */}
      <div className="relative w-40 h-40 mx-auto mb-10">
        <div className="absolute inset-0 rounded-full"
             style={{ background: "radial-gradient(circle, rgba(245,210,221,0.7) 0%, transparent 70%)",
                      animation: "bloom-pulse 3s ease-in-out infinite" }}/>
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" style={{ animation: "spin-slow 22s linear infinite" }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            return (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                <ellipse cx="100" cy="55" rx="13" ry="20" fill="#F5D2DD" opacity="0.85"/>
                <ellipse cx="100" cy="55" rx="6" ry="9" fill="#E68AA1" opacity="0.55"/>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="9" fill="#FFE9A8"/>
          <circle cx="100" cy="100" r="4" fill="#B89668"/>
        </svg>
      </div>

      <p className="text-[10px] tracking-[0.45em] uppercase text-[#B89668] mb-3">Crafting your sanctuary</p>
      <h2 className="font-serif text-3xl sm:text-4xl text-[#1F2A24] mb-4">
        Creating your <span className="italic text-[#E68AA1]">personalized</span> plan…
      </h2>
      <p className="text-[#1F2A24]/70 leading-relaxed mb-8 font-serif">
        IKIGAI is reading what you shared and shaping a path that's yours alone — gentle habits, weekly intentions, a tree to grow with.
      </p>

      {summary && (
        <p className="text-sm text-[#7A6F66] italic max-w-md mx-auto leading-relaxed">"{summary}"</p>
      )}

      {/* shimmer */}
      <div className="mt-10 inline-flex gap-1.5 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E68AA1] animate-pulse"/>
        <span className="w-1.5 h-1.5 rounded-full bg-[#E68AA1] animate-pulse" style={{ animationDelay: "0.2s" }}/>
        <span className="w-1.5 h-1.5 rounded-full bg-[#E68AA1] animate-pulse" style={{ animationDelay: "0.4s" }}/>
      </div>
    </div>
  </div>
);
