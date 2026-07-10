import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import {
  Sparkles, Plus, Check, Trash2, RotateCcw, Compass, Map, X, Loader2, Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function Plan() {
  const [plan, setPlan] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWhy, setNewWhy] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([client.get("/plan"), client.get("/habits")]);
      setPlan(p.data?.plan);
      setHabits(h.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const { data } = await client.post("/plan/generate");
      setPlan(data.plan);
      toast.success("Your plan has been refreshed 🌸");
      await loadAll();
    } catch { toast.error("Couldn't refresh"); }
    finally { setRegenerating(false); }
  };

  const proposeHabit = async () => {
    if (!newTitle.trim()) { toast.error("Tell IKIGAI what you'd like to try"); return; }
    setEvaluating(true); setVerdict(null);
    try {
      const { data } = await client.post("/habits/propose", { title: newTitle, why: newWhy });
      setVerdict(data);
      if (data.approved) {
        toast.success("IKIGAI added it to your habits 🌸");
        setNewTitle(""); setNewWhy("");
        await loadAll();
        setTimeout(() => { setShowAdd(false); setVerdict(null); }, 2400);
      }
    } catch { toast.error("Couldn't evaluate the habit"); }
    finally { setEvaluating(false); }
  };

  const completeHabit = async (id) => {
    try {
      await client.post("/habits/complete", { habit_id: id });
      await loadAll();
    } catch { toast.error("Couldn't mark complete"); }
  };

  const deleteHabit = async (id) => {
    try {
      await client.delete(`/habits/${id}`);
      await loadAll();
    } catch { toast.error("Couldn't remove"); }
  };

  if (loading) {
    return <Layout><div className="text-center text-[#7A6F66] py-20">Tending your plan…</div></Layout>;
  }

  if (!plan) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto zen-card p-12 text-center" data-testid="plan-empty">
          <Sparkles className="w-7 h-7 mx-auto text-[#E68AA1] mb-3" strokeWidth={1.5}/>
          <h2 className="font-serif text-3xl text-[#1F2A24] mb-2">Your plan is being tended</h2>
          <p className="text-[#7A6F66] mb-6">If your sanctuary just opened, give it a moment — or generate it now.</p>
          <button onClick={regenerate} disabled={regenerating} className="btn-primary inline-flex items-center gap-2 active:scale-95 transition" data-testid="plan-generate">
            {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
            {regenerating ? "Crafting…" : "Generate my plan"}
          </button>
        </div>
      </Layout>
    );
  }

  const weeks = plan.weeks || [];
  const firstWeek = plan.first_week_actions || [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto" data-testid="plan-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2 flex items-center gap-1.5">
          <Map className="w-3 h-3"/> Your personal plan
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-3">
          <h1 className="font-serif text-5xl text-[#1F2A24] leading-tight">
            A <span className="italic text-[#E68AA1]">{plan.weeks_count || 4}-week</span> path,<br/>shaped for you.
          </h1>
          <button onClick={regenerate} disabled={regenerating}
                  className="btn-ghost text-xs inline-flex items-center gap-1.5 active:scale-95 transition" data-testid="plan-refresh">
            <RotateCcw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`}/>
            {regenerating ? "Refreshing…" : "Refresh plan"}
          </button>
        </div>

        {plan.summary && (
          <div className="zen-card p-7 mb-7" data-testid="plan-summary"
               style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.35), rgba(255,247,233,0.45))" }}>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#B89668] mb-2">A note from IKIGAI</p>
            <p className="font-serif text-xl text-[#1F2A24] leading-relaxed italic">"{plan.summary}"</p>
          </div>
        )}

        {/* First week actions */}
        {firstWeek.length > 0 && (
          <div className="zen-card p-7 mb-7" data-testid="first-week">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2 flex items-center gap-1.5">
              <Calendar className="w-3 h-3"/> First seven days
            </p>
            <h3 className="font-serif text-2xl text-[#1F2A24] mb-5">Start with these</h3>
            <ol className="space-y-3">
              {firstWeek.map((a, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="font-serif text-2xl text-[#E68AA1] shrink-0 leading-none">{i + 1}.</span>
                  <span className="text-[#1F2A24]/85 leading-relaxed">{a}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Weeks accordion */}
        {weeks.length > 0 && (
          <div className="mb-8">
            <h3 className="font-serif text-2xl text-[#1F2A24] mb-4">Your weeks</h3>
            <div className="space-y-3" data-testid="plan-weeks">
              {weeks.map((w, i) => (
                <div key={i} className="zen-card p-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#B89668]">Week {w.week || (i + 1)}</p>
                    <p className="font-serif italic text-[#7A6F66] text-sm">{w.theme}</p>
                  </div>
                  <p className="font-serif text-xl text-[#1F2A24] mb-3">{w.focus}</p>
                  {w.intentions && w.intentions.length > 0 && (
                    <ul className="space-y-1.5">
                      {w.intentions.map((it, j) => (
                        <li key={j} className="flex gap-2 text-sm text-[#1F2A24]/80">
                          <span className="text-[#E68AA1]">·</span>{it}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habits */}
        <div className="zen-card p-7" data-testid="habits-card">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1">Daily habits</p>
              <h3 className="font-serif text-2xl text-[#1F2A24]">Tiny acts that grow your tree</h3>
            </div>
            <button onClick={() => setShowAdd(true)}
                    className="btn-primary inline-flex items-center gap-1.5 active:scale-95 transition" data-testid="habit-add-btn">
              <Plus className="w-3.5 h-3.5"/> Add habit
            </button>
          </div>

          {habits.length === 0 ? (
            <p className="text-[#7A6F66] text-sm italic">No habits yet. IKIGAI seeds a few based on your plan — generate or add your own.</p>
          ) : (
            <ul className="space-y-3" data-testid="habits-list">
              {habits.map(h => (
                <li key={h.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                      h.done_today ? "bg-[#F5D2DD]/25 border-[#E68AA1]/30" : "bg-white/60 border-[#1F2A24]/8"
                    }`}
                    data-testid={`habit-${h.id}`}>
                  <button onClick={() => !h.done_today && completeHabit(h.id)}
                          disabled={h.done_today}
                          className={`shrink-0 w-9 h-9 rounded-full border-2 transition active:scale-90 flex items-center justify-center ${
                            h.done_today ? "bg-[#E68AA1] border-[#E68AA1] text-white" : "border-[#1F2A24]/20 hover:border-[#E68AA1]"
                          }`}
                          data-testid={`habit-complete-${h.id}`}>
                    {h.done_today && <Check className="w-4 h-4" strokeWidth={3}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-serif text-lg leading-snug ${h.done_today ? "text-[#1F2A24]/60 line-through" : "text-[#1F2A24]"}`}>
                      {h.title}
                    </p>
                    <div className="flex gap-2 items-center text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mt-0.5">
                      <span>{h.cadence || "daily"}</span>
                      <span>·</span>
                      <span>{h.completions || 0} done</span>
                      {h.source === "plan" && (<><span>·</span><span className="text-[#B89668]">from plan</span></>)}
                    </div>
                    {h.why && <p className="text-xs text-[#7A6F66] italic mt-1 line-clamp-2">{h.why}</p>}
                  </div>
                  <button onClick={() => deleteHabit(h.id)}
                          className="p-2 rounded-full text-[#7A6F66]/60 hover:text-[#E68AA1] hover:bg-[#E68AA1]/8 transition active:scale-95"
                          data-testid={`habit-delete-${h.id}`}>
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {plan.signpost && (
          <div className="text-center mt-12 mb-6">
            <p className="text-[10px] tracking-[0.45em] uppercase text-[#7A6F66] mb-2">When the path completes</p>
            <p className="font-serif italic text-2xl text-[#E68AA1] max-w-2xl mx-auto">"{plan.signpost}"</p>
          </div>
        )}
      </div>

      {showAdd && (
        <AddHabitModal
          title={newTitle} setTitle={setNewTitle}
          why={newWhy} setWhy={setNewWhy}
          evaluating={evaluating} verdict={verdict}
          onSubmit={proposeHabit} onClose={() => { setShowAdd(false); setVerdict(null); setNewTitle(""); setNewWhy(""); }}
        />
      )}
    </Layout>
  );
}

const AddHabitModal = ({ title, setTitle, why, setWhy, evaluating, verdict, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
       data-testid="add-habit-modal" onClick={onClose}>
    <div className="absolute inset-0 bg-[#1F2A24]/40 backdrop-blur-sm"/>
    <div className="relative w-full sm:max-w-lg bg-[#FAF7F1] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-fade-up"
         onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-[#1F2A24]/60 hover:bg-[#1F2A24]/5 active:scale-95 transition" data-testid="add-habit-close">
        <X className="w-4 h-4"/>
      </button>
      <div className="p-7 sm:p-9">
        <p className="text-[10px] tracking-[0.45em] uppercase text-[#B89668] mb-2">Add a habit</p>
        <h3 className="font-serif text-3xl text-[#1F2A24] mb-1">Tell IKIGAI what you'd like to try</h3>
        <p className="text-sm text-[#7A6F66] mb-6">
          IKIGAI will only add it if it clearly fits your stated goals — kindly honest, not gatekeeping.
        </p>

        <input className="input-zen mb-3" placeholder="The habit (e.g. 5 min stretch before school)"
               value={title} onChange={e => setTitle(e.target.value)} data-testid="habit-title"
               autoFocus/>
        <textarea className="input-zen min-h-[90px] mb-4"
                  placeholder="Why does this matter to you? (optional)"
                  value={why} onChange={e => setWhy(e.target.value)} data-testid="habit-why"/>

        {verdict && (
          <div className={`p-4 rounded-2xl mb-4 border ${
            verdict.approved
              ? "bg-[#7AA37A]/10 border-[#7AA37A]/30 text-[#1F2A24]"
              : "bg-[#E68AA1]/10 border-[#E68AA1]/30 text-[#1F2A24]"
          }`} data-testid="habit-verdict">
            <p className="text-[10px] tracking-[0.25em] uppercase mb-1.5"
               style={{ color: verdict.approved ? "#5C7E5C" : "#B6678A" }}>
              {verdict.approved ? "Approved by IKIGAI 🌸" : "Held back, gently"}
            </p>
            <p className="font-serif leading-relaxed">{verdict.reason}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-ghost active:scale-95 transition" data-testid="habit-cancel">Cancel</button>
          <button onClick={onSubmit} disabled={evaluating || !title.trim()}
                  className="btn-primary inline-flex items-center gap-2 active:scale-95 transition disabled:opacity-60"
                  data-testid="habit-submit">
            {evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Compass className="w-3.5 h-3.5"/>}
            {evaluating ? "Asking IKIGAI…" : "Ask IKIGAI"}
          </button>
        </div>
      </div>
    </div>
  </div>
);
