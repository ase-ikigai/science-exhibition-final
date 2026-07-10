import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Moon, Dumbbell, Smartphone, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function Wellness() {
  const [tab, setTab] = useState("sleep");
  const [sleep, setSleep] = useState({ hours: 8, quality: 7, note: "" });
  const [fitness, setFitness] = useState({ activity: "walk", minutes: 20, note: "" });
  const [screen, setScreen] = useState({ hours: 4, note: "" });
  const [sleepLogs, setSleepLogs] = useState([]);
  const [fitnessLogs, setFitnessLogs] = useState([]);
  const [screenLogs, setScreenLogs] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const load = async () => {
    const [s, f, st, ach] = await Promise.all([
      client.get("/wellness/sleep"), client.get("/wellness/fitness"),
      client.get("/wellness/screentime"), client.get("/achievements"),
    ]);
    setSleepLogs(s.data); setFitnessLogs(f.data); setScreenLogs(st.data); setAchievements(ach.data);
  };
  useEffect(() => { load(); }, []);

  const submit = async (kind) => {
    try {
      if (kind === "sleep") await client.post("/wellness/sleep", sleep);
      if (kind === "fitness") await client.post("/wellness/fitness", fitness);
      if (kind === "screen") await client.post("/wellness/screentime", screen);
      toast.success("Logged 🌸");
      await load();
    } catch { toast.error("Could not save"); }
  };

  const tabs = [
    { id: "sleep", label: "Sleep", icon: Moon },
    { id: "fitness", label: "Movement", icon: Dumbbell },
    { id: "screen", label: "Screen", icon: Smartphone },
    { id: "achievements", label: "Achievements", icon: Trophy },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto" data-testid="wellness-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Wellness</p>
        <h1 className="font-serif text-5xl text-[#1F2A24] mb-8">Care for the whole tree</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
              className={`px-4 py-2 rounded-full text-xs tracking-[0.1em] uppercase whitespace-nowrap inline-flex items-center gap-1.5 transition ${
                tab === t.id ? 'bg-[#2D3F36] text-[#FAF7F1]' : 'bg-white/60 text-[#1F2A24]/70'}`}>
              <t.icon className="w-3.5 h-3.5"/> {t.label}
            </button>
          ))}
        </div>

        {tab === "sleep" && (
          <div className="zen-card p-7" data-testid="sleep-panel">
            <h3 className="font-serif text-2xl mb-4">Last night's sleep</h3>
            <label className="text-sm text-[#7A6F66]">Hours: <strong className="text-[#1F2A24]">{sleep.hours}</strong></label>
            <input type="range" min={3} max={12} step={0.5} value={sleep.hours} onChange={e => setSleep(s => ({...s, hours: Number(e.target.value)}))} className="w-full accent-[#E68AA1] mb-4" data-testid="sleep-hours"/>
            <label className="text-sm text-[#7A6F66]">Quality: <strong className="text-[#1F2A24]">{sleep.quality}/10</strong></label>
            <input type="range" min={1} max={10} value={sleep.quality} onChange={e => setSleep(s => ({...s, quality: Number(e.target.value)}))} className="w-full accent-[#E68AA1] mb-4" data-testid="sleep-quality"/>
            <textarea className="input-zen min-h-[70px] mb-3" placeholder="Note (optional)" value={sleep.note} onChange={e => setSleep(s => ({...s, note: e.target.value}))}/>
            <button onClick={() => submit("sleep")} className="btn-primary" data-testid="sleep-save">Log sleep</button>
            <ul className="mt-5 space-y-2 text-sm text-[#1F2A24]/80">
              {sleepLogs.slice(0,5).map(l => <li key={l.id}>· {l.date}: {l.hours}h · {l.quality}/10</li>)}
            </ul>
          </div>
        )}

        {tab === "fitness" && (
          <div className="zen-card p-7" data-testid="fitness-panel">
            <h3 className="font-serif text-2xl mb-4">Movement</h3>
            <select className="input-zen mb-3" value={fitness.activity} onChange={e => setFitness(f => ({...f, activity: e.target.value}))} data-testid="fitness-activity">
              {["walk","run","sport","workout","yoga","dance"].map(a => <option key={a}>{a}</option>)}
            </select>
            <label className="text-sm text-[#7A6F66]">Minutes: <strong className="text-[#1F2A24]">{fitness.minutes}</strong></label>
            <input type="range" min={5} max={120} step={5} value={fitness.minutes} onChange={e => setFitness(f => ({...f, minutes: Number(e.target.value)}))} className="w-full accent-[#E68AA1] mb-4"/>
            <button onClick={() => submit("fitness")} className="btn-primary" data-testid="fitness-save">Log movement</button>
            <ul className="mt-5 space-y-2 text-sm text-[#1F2A24]/80">
              {fitnessLogs.slice(0,5).map(l => <li key={l.id}>· {l.date}: {l.activity} · {l.minutes}min</li>)}
            </ul>
          </div>
        )}

        {tab === "screen" && (
          <div className="zen-card p-7" data-testid="screen-panel">
            <h3 className="font-serif text-2xl mb-4">Screen time</h3>
            <label className="text-sm text-[#7A6F66]">Hours today: <strong className="text-[#1F2A24]">{screen.hours}</strong></label>
            <input type="range" min={0} max={16} step={0.5} value={screen.hours} onChange={e => setScreen(s => ({...s, hours: Number(e.target.value)}))} className="w-full accent-[#E68AA1] mb-4" data-testid="screen-hours"/>
            <button onClick={() => submit("screen")} className="btn-primary" data-testid="screen-save">Log screen time</button>
            <p className="text-xs text-[#7A6F66] mt-4 italic">Awareness, not guilt. Each log is a quiet act of care.</p>
            <ul className="mt-5 space-y-2 text-sm text-[#1F2A24]/80">
              {screenLogs.slice(0,5).map(l => <li key={l.id}>· {l.date}: {l.hours}h</li>)}
            </ul>
          </div>
        )}

        {tab === "achievements" && (
          <div className="grid md:grid-cols-2 gap-4" data-testid="achievements-panel">
            {achievements.map(a => (
              <div key={a.id} className={`zen-card p-6 flex items-center gap-4 ${a.earned ? '' : 'opacity-50'}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: a.earned ? "linear-gradient(135deg, #F5D2DD, #B89668)" : "#EDE4D3" }}>
                  <Trophy className={`w-5 h-5 ${a.earned ? 'text-white' : 'text-[#7A6F66]'}`} strokeWidth={1.5}/>
                </div>
                <div>
                  <div className="font-serif text-lg">{a.title}</div>
                  <div className="text-xs text-[#7A6F66]">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
