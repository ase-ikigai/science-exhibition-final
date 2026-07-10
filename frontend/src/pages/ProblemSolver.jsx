import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { ArrowLeft, Sparkles, Eye, Cog, Compass, Sunrise, Mountain } from "lucide-react";
import { toast } from "sonner";

export default function ProblemSolver() {
  const [problems, setProblems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [context, setContext] = useState("");
  const [solving, setSolving] = useState(false);
  const [playbook, setPlaybook] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    const r = await client.get("/problem-solver/history");
    setHistory(r.data || []);
  };

  useEffect(() => {
    client.get("/problem-solver/problems").then(r => setProblems(r.data || [])).catch(() => {});
    loadHistory();
  }, []);

  const solve = async () => {
    if (!selected) return;
    setSolving(true); setPlaybook(null);
    try {
      const { data } = await client.post("/problem-solver/solve", {
        problem: selected.label, context,
      });
      setPlaybook(data.playbook);
      await loadHistory();
      toast.success("A path appears 🌸");
    } catch { toast.error("Could not solve"); }
    finally { setSolving(false); }
  };

  const reset = () => { setSelected(null); setContext(""); setPlaybook(null); };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto" data-testid="problem-solver-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Solve</p>
        <h1 className="font-serif text-5xl mb-3 text-[#1F2A24]">What's tangled?</h1>
        <p className="text-[#1F2A24]/70 mb-10 leading-relaxed">
          Choose what feels heaviest right now. IKIGAI offers a quiet, practical path — not motivational fluff.
        </p>

        {!selected && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12" data-testid="problems-grid">
            {problems.map(p => (
              <button key={p.id} onClick={() => setSelected(p)} data-testid={`problem-${p.id}`}
                className="zen-card p-7 text-left hover:-translate-y-1 active:translate-y-0 transition-transform group">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{p.emoji}</div>
                <div className="font-serif text-xl text-[#1F2A24]">{p.label}</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mt-1">A gentle path →</div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="zen-card p-8 mb-10 animate-fade-up">
            <button onClick={reset} className="text-xs tracking-[0.2em] uppercase text-[#7A6F66] hover:text-[#1F2A24] inline-flex items-center gap-1 mb-5 transition" data-testid="problem-back">
              <ArrowLeft className="w-3.5 h-3.5"/> all problems
            </button>
            <div className="text-5xl mb-3">{selected.emoji}</div>
            <h2 className="font-serif text-3xl mb-5 text-[#1F2A24]">{selected.label}</h2>

            {!playbook && (
              <>
                <textarea className="input-zen min-h-[110px] mb-4"
                          placeholder="Tell IKIGAI a bit more — what does it look like for you? (optional)"
                          value={context} onChange={e => setContext(e.target.value)}
                          data-testid="problem-context"/>
                <button onClick={solve} disabled={solving} className="btn-primary active:scale-95 transition-transform" data-testid="problem-solve">
                  {solving ? "Listening…" : "Show me a path"}
                </button>
                {solving && (
                  <div className="mt-6 space-y-2 animate-pulse" data-testid="solve-loading">
                    <div className="h-3 w-1/2 bg-[#1F2A24]/8 rounded-full"/>
                    <div className="h-3 w-2/3 bg-[#1F2A24]/8 rounded-full"/>
                    <div className="h-3 w-3/4 bg-[#1F2A24]/8 rounded-full"/>
                  </div>
                )}
              </>
            )}

            {playbook && (
              <div className="space-y-6 mt-2 animate-fade-up">
                <PlaybookSection icon={Eye} accent="#E68AA1" label="What's happening">
                  <p className="text-[#1F2A24]/85 leading-relaxed font-serif text-lg">{playbook.happening || playbook.why}</p>
                </PlaybookSection>
                <PlaybookSection icon={Cog} accent="#B5B5DC" label="Why it happens">
                  <p className="text-[#1F2A24]/85 leading-relaxed">{playbook.why}</p>
                </PlaybookSection>
                <PlaybookSection icon={Compass} accent="#7AA37A" label="What you can control">
                  <ul className="space-y-2">
                    {(playbook.control || playbook.this_week || []).map((t, i) => (
                      <li key={i} className="flex gap-3 p-3 rounded-2xl bg-white/50">
                        <span className="text-[#7AA37A] shrink-0">◇</span>
                        <span className="text-[#1F2A24]/85">{t}</span>
                      </li>
                    ))}
                  </ul>
                </PlaybookSection>
                <PlaybookSection icon={Sunrise} accent="#B89668" label="One action today">
                  <div className="p-4 rounded-2xl"
                       style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.35), rgba(255,247,233,0.6))",
                                border: "1px solid rgba(230,138,161,0.25)" }}>
                    <p className="font-serif text-xl text-[#1F2A24] leading-snug">
                      {playbook.action_today || (playbook.today && playbook.today[0]) || "Drink water, then write one sentence about what you need."}
                    </p>
                  </div>
                </PlaybookSection>
                {playbook.longterm && (
                  <PlaybookSection icon={Mountain} accent="#34403A" label="Long-term approach">
                    <p className="text-[#1F2A24]/85 leading-relaxed">{playbook.longterm}</p>
                  </PlaybookSection>
                )}
                {playbook.reframe && (
                  <div className="pt-4 border-t border-[#1F2A24]/8">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-2">Reframe</p>
                    <p className="font-serif text-2xl text-[#E68AA1] italic">"{playbook.reframe}"</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-3">
                  <button onClick={reset} className="btn-ghost active:scale-95 transition" data-testid="problem-reset">Try another</button>
                </div>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && !selected && (
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-4">Past Playbooks</p>
            <div className="space-y-3" data-testid="problem-history">
              {history.slice(0, 5).map(h => (
                <div key={h.id} className="zen-card p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif text-lg text-[#1F2A24]">{h.problem}</span>
                    <span className="text-xs text-[#7A6F66]">
                      {new Date(h.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-[#1F2A24]/75 mt-1 italic">"{h.playbook?.reframe || (h.playbook?.action_today || '')}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const PlaybookSection = ({ icon: Icon, accent, label, children }) => (
  <section className="animate-fade-up">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: `${accent}15`, color: accent }}>
        <Icon className="w-3.5 h-3.5" strokeWidth={1.75}/>
      </span>
      <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66]">{label}</p>
    </div>
    <div className="pl-9">{children}</div>
  </section>
);
