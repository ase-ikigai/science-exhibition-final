import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Check, Sparkles, Star, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Missions() {
  const [missions, setMissions] = useState([]);
  const [habits, setHabits] = useState([]);
  const [motivation, setMotivation] = useState("");
  const [loadingMotivation, setLoadingMotivation] = useState(false);

  const load = async () => {
    const [m, h] = await Promise.all([
      client.get("/missions/today"),
      client.get("/habits").catch(() => ({ data: [] })),
    ]);
    setMissions(m.data?.missions || []);
    setHabits(h.data || []);
  };

  const loadMotivation = async () => {
    setLoadingMotivation(true);
    try {
      const { data } = await client.get("/motivations/quote");
      setMotivation(data.quote);
    } catch (e) {
      console.error("Failed to load quote");
    } finally {
      setLoadingMotivation(false);
    }
  };

  useEffect(() => {
    load();
    loadMotivation();
  }, []);

  const complete = async (id) => {
    try {
      await client.post("/missions/complete", { mission_id: id });
      toast.success("A blossom 🌸");
      await load();
      await loadMotivation();
    } catch { toast.error("Could not save"); }
  };

  const completeHabit = async (id) => {
    try {
      await client.post("/habits/complete", { habit_id: id });
      toast.success("A blossom 🌸");
      await load();
      await loadMotivation();
    } catch { toast.error("Could not save"); }
  };

  const done = missions.filter(m => m.done).length + habits.filter(h => h.done_today).length;
  const total = (missions.length + habits.length) || 1;
  const pct = Math.round(done / total * 100);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto" data-testid="missions-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Today's Missions</p>
        <h1 className="font-serif text-5xl text-[#1F2A24] mb-3">Small, kind acts</h1>
        <p className="text-[#1F2A24]/70 mb-8 leading-relaxed">
          No streaks. No guilt. Each finished mission grows your tree — that's all.
        </p>

        {/* Motivational Quote — calibrated to YOUR progress */}
        {motivation && (
          <div className="zen-card p-7 mb-8 bg-gradient-to-br from-[#FFE9A8]/20 to-[#FAF7F1] border border-[#B89668]/20 animate-fade-up"
               data-testid="motivation-card">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-[#B89668] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] mb-2">A word for today · shaped for your progress</p>
                <p className="font-serif text-xl italic text-[#1F2A24] leading-relaxed">{motivation}</p>
              </div>
            </div>
          </div>
        )}

        <div className="zen-card p-6 mb-6">
          <div className="flex justify-between text-xs tracking-[0.2em] uppercase text-[#7A6F66] mb-2">
            <span>{done}/{total} done</span><span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-[#EDE4D3] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#E68AA1] to-[#B89668] transition-all duration-700" style={{ width: `${pct}%` }}/>
          </div>
        </div>

        {/* Today's Missions */}
        {missions.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-3">Today's gentle missions</p>
            <ul className="space-y-3" data-testid="mission-list">
              {missions.map(m => (
                <li key={m.id} className="zen-card p-5 flex items-center gap-4">
                  <span className="text-2xl">{m.icon}</span>
                  <span className={`flex-1 font-serif text-lg ${m.done ? 'line-through text-[#7A6F66]' : 'text-[#1F2A24]'}`}>
                    {m.label}
                  </span>
                  {m.done ? (
                    <span className="flex items-center gap-1 text-xs tracking-[0.15em] uppercase text-[#7AA37A]">
                      <Check className="w-4 h-4"/> Done
                    </span>
                  ) : (
                    <button onClick={() => complete(m.id)} className="btn-primary text-xs active:scale-95 transition" data-testid={`mission-done-${m.id}`}>
                      Mark done
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* User Habits (from Plan & added by user) */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66]">Your daily habits</p>
            <Link to="/plan" className="text-[10px] tracking-[0.2em] uppercase text-[#B89668] hover:text-[#1F2A24] inline-flex items-center gap-1 transition" data-testid="manage-habits-link">
              <Plus className="w-3 h-3"/> Manage & add
            </Link>
          </div>
          {habits.length === 0 ? (
            <div className="zen-card p-6 text-center" data-testid="habits-empty">
              <Sparkles className="w-5 h-5 mx-auto text-[#E68AA1] mb-2" strokeWidth={1.5}/>
              <p className="text-sm text-[#7A6F66]">No habits yet — IKIGAI seeds a few based on your plan, and you can add your own.</p>
              <Link to="/plan" className="btn-primary inline-flex items-center gap-1.5 mt-4 active:scale-95 transition" data-testid="habits-empty-cta">
                <Plus className="w-3.5 h-3.5"/> Go to Plan
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" data-testid="habits-list-missions">
              {habits.map(h => (
                <li key={h.id} className={`zen-card p-5 flex items-center gap-4 transition ${
                  h.done_today ? "bg-[#F5D2DD]/20" : ""
                }`} data-testid={`habit-row-${h.id}`}>
                  <button onClick={() => !h.done_today && completeHabit(h.id)}
                          disabled={h.done_today}
                          className={`shrink-0 w-9 h-9 rounded-full border-2 transition active:scale-90 flex items-center justify-center ${
                            h.done_today ? "bg-[#E68AA1] border-[#E68AA1] text-white" : "border-[#1F2A24]/20 hover:border-[#E68AA1]"
                          }`}
                          data-testid={`habit-mission-complete-${h.id}`}>
                    {h.done_today && <Check className="w-4 h-4" strokeWidth={3}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-serif text-lg leading-snug ${h.done_today ? "text-[#1F2A24]/60 line-through" : "text-[#1F2A24]"}`}>
                      {h.title}
                    </p>
                    <div className="flex gap-2 items-center text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mt-0.5">
                      <span>{h.cadence || "daily"}</span>
                      {h.source === "plan" && (<><span>·</span><span className="text-[#B89668]">from plan</span></>)}
                      {h.completions > 0 && (<><span>·</span><span>{h.completions} done</span></>)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
