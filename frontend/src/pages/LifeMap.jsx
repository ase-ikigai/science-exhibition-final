import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const AREA_META = {
  School: { color: "#FFB7C5", icon: "📚" },
  Friends: { color: "#E6E6FA", icon: "🤝" },
  Family: { color: "#FFE5C9", icon: "🏠" },
  Health: { color: "#D4E0D1", icon: "🌿" },
  Confidence: { color: "#FFD7E1", icon: "🌸" },
  Purpose: { color: "#E8D5F0", icon: "✨" },
  Hobbies: { color: "#FFF0C9", icon: "🎨" },
};

export default function LifeMap() {
  const [summary, setSummary] = useState([]);
  const [areas, setAreas] = useState([]);
  const [picked, setPicked] = useState(null);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [patterns, setPatterns] = useState(null);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  const load = async () => {
    const [a, s] = await Promise.all([
      client.get("/life-map/areas"),
      client.get("/life-map/summary"),
    ]);
    setAreas(a.data.areas);
    setSummary(s.data.summary);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      await client.post("/life-map/entry", { area: picked, rating, note });
      setPicked(null); setNote(""); setRating(5);
      await load();
      toast.success("Mapped 🌸");
    } catch { toast.error("Could not save"); }
    finally { setSaving(false); }
  };

  const fetchPatterns = async () => {
    setLoadingPatterns(true);
    try {
      const { data } = await client.get("/life-map/patterns");
      setPatterns(data);
    } finally { setLoadingPatterns(false); }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto" data-testid="life-map-page">
        <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Life Map</p>
        <h1 className="font-serif text-5xl mb-3">What's shaping you</h1>
        <p className="text-[#2D1B22]/70 mb-8 leading-relaxed">
          Don't just track feelings — track <em>why</em>. Rate each area of your life, jot a thought, and discover patterns over time.
        </p>

        {!picked ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="area-grid">
            {summary.map(s => {
              const meta = AREA_META[s.area] || { color: "#FFB7C5", icon: "✦" };
              return (
                <button key={s.area} onClick={() => setPicked(s.area)} data-testid={`area-${s.area}`}
                  className="zen-card p-6 text-left hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                       style={{ background: meta.color }}>{meta.icon}</div>
                  <div className="font-serif text-xl">{s.area}</div>
                  <div className="text-xs text-[#8A7E82] mt-1">
                    {s.count === 0 ? "Not mapped yet" : `Avg ${s.avg} · ${s.count} note${s.count > 1 ? 's' : ''}`}
                  </div>
                  {s.avg && (
                    <div className="h-1 mt-3 rounded-full bg-[#F9F6F0] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.avg * 10}%`, background: meta.color, filter: "saturate(1.3)" }}/>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="zen-card p-8 mb-10 animate-fade-up">
            <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">{picked}</p>
            <h2 className="font-serif text-3xl mb-6">How is {picked.toLowerCase()} feeling lately?</h2>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#8A7E82]">heavy</span>
                <span className="text-[#E68AA1] font-medium text-lg">{rating}/10</span>
                <span className="text-[#8A7E82]">light</span>
              </div>
              <input type="range" min={1} max={10} value={rating} onChange={e => setRating(Number(e.target.value))}
                     className="w-full accent-[#E68AA1]" data-testid="area-rating"/>
            </div>
            <textarea className="input-zen min-h-[100px]" placeholder="What's going on in this area? (optional)"
                      value={note} onChange={e => setNote(e.target.value)} data-testid="area-note"/>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setPicked(null)} className="btn-ghost" data-testid="area-cancel">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary" data-testid="area-save">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Patterns */}
        <div className="zen-card p-8" data-testid="patterns-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-1 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5"/> Patterns
              </p>
              <h3 className="font-serif text-2xl">What we're noticing</h3>
            </div>
            <button onClick={fetchPatterns} disabled={loadingPatterns} className="btn-ghost text-sm" data-testid="patterns-refresh">
              {loadingPatterns ? "Reading..." : patterns ? "Refresh" : "Reveal"}
            </button>
          </div>

          {!patterns && !loadingPatterns && (
            <p className="text-[#8A7E82]">Add a few life-map entries, then ask IKIGAI to find your patterns.</p>
          )}

          {patterns && (
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mb-3">Recurring themes</p>
                <ul className="space-y-3">
                  {(patterns.patterns || []).map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <Sparkles className="w-4 h-4 text-[#E68AA1] mt-1 shrink-0" strokeWidth={1.5}/>
                      <div>
                        <div className="font-serif text-lg">{p.title}</div>
                        <div className="text-sm text-[#2D1B22]/75">{p.insight}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mb-3">Areas to water</p>
                <ul className="space-y-3">
                  {(patterns.areas_to_water || []).map((a, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#B5B5DC] mt-2 shrink-0"/>
                      <div>
                        <div className="font-serif text-lg">{a.area}</div>
                        <div className="text-sm text-[#2D1B22]/75">{a.why}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
