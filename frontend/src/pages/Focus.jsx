import React, { useEffect, useRef, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [{ m: 25, label: "Pomodoro" }, { m: 15, label: "Short" }, { m: 45, label: "Deep" }];

export default function Focus() {
  const [duration, setDuration] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [task, setTask] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => setRemaining(r => {
        if (r <= 1) { clearInterval(timer.current); setRunning(false); finish(); return 0; }
        return r - 1;
      }), 1000);
    }
    return () => clearInterval(timer.current);
  }, [running]);

  const finish = async () => {
    const mins = Math.round((duration - remaining) / 60) || Math.round(duration / 60);
    try {
      await client.post("/focus/session", { minutes: Math.round(duration / 60), task });
      toast.success(`Focus complete — petals fall 🌸`);
    } catch (e) {
      console.error("focus log failed:", e);
    }
  };

  const setPreset = (mins) => { setDuration(mins * 60); setRemaining(mins * 60); setRunning(false); };
  const reset = () => { setRemaining(duration); setRunning(false); };

  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');
  const pct = ((duration - remaining) / duration) * 100;

  return (
    <Layout>
      <div className="max-w-xl mx-auto text-center" data-testid="focus-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Focus</p>
        <h1 className="font-serif text-5xl text-[#1F2A24] mb-3">Stay present</h1>
        <p className="text-[#1F2A24]/70 mb-10">Each completed session grows your tree.</p>

        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" stroke="#EDE4D3" strokeWidth="3" fill="none"/>
            <circle cx="50" cy="50" r="46" stroke="#E68AA1" strokeWidth="3" fill="none"
                    strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 46}`}
                    strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct/100)}`}
                    style={{ transition: "stroke-dashoffset 1s linear" }}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-6xl text-[#1F2A24]" data-testid="focus-timer">{mm}:{ss}</span>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mt-2">Focus Time</span>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {PRESETS.map(p => (
            <button key={p.m} onClick={() => setPreset(p.m)}
                    className={`px-4 py-2 rounded-full text-xs tracking-[0.1em] uppercase transition ${
                      duration === p.m * 60 ? 'bg-[#2D3F36] text-[#FAF7F1]' : 'bg-white/60 text-[#1F2A24]/70'}`}
                    data-testid={`preset-${p.m}`}>
              {p.label} {p.m}m
            </button>
          ))}
        </div>

        <input className="input-zen text-center mb-5" placeholder="What are you focusing on?"
               value={task} onChange={e => setTask(e.target.value)} data-testid="focus-task"/>

        <div className="flex justify-center gap-3">
          <button onClick={() => setRunning(r => !r)} className="btn-primary inline-flex items-center gap-2" data-testid="focus-toggle">
            {running ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Start</>}
          </button>
          <button onClick={reset} className="btn-ghost inline-flex items-center gap-2" data-testid="focus-reset">
            <RotateCcw className="w-4 h-4"/> Reset
          </button>
        </div>
      </div>
    </Layout>
  );
}
