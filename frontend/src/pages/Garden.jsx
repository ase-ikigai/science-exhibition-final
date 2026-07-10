import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { SakuraTree, TreeStageLabel } from "../components/SakuraTree";
import client from "../lib/api";
import { Sparkles, Flower2, ScrollText, Heart, Compass, BookHeart, Map, Clock } from "lucide-react";

const KIND_META = {
  mood:    { icon: Heart,        accent: "#E68AA1", label: "Mood Dump" },
  journal: { icon: ScrollText,   accent: "#B89668", label: "Journal Entry" },
  solve:   { icon: Compass,      accent: "#7AA37A", label: "Solved a Problem" },
  mission: { icon: BookHeart,    accent: "#B5B5DC", label: "Mission Complete" },
  lifemap: { icon: Map,          accent: "#D8A6A6", label: "Life Map Note" },
  focus:   { icon: Clock,        accent: "#34403A", label: "Focus Session" },
};

const STAGE_LABELS = {
  sprout: "A Sprout Appeared",
  seedling: "Young Seedling Steady",
  growing: "Branches Found the Sky",
  mature: "A Mature Tree",
  blooming: "Full Bloom Arrived",
  radiant: "Radiant Sakura",
  // legacy
  young_tree: "Roots Found Their Place",
  growing_sakura: "Sakura Began to Bud",
  blooming_sakura: "Full Bloom Arrived",
  ancient_sakura: "An Ancient Sakura",
};

export default function Garden() {
  const [timeline, setTimeline] = useState(null);

  useEffect(() => { client.get("/tree/timeline").then(r => setTimeline(r.data)).catch(() => {}); }, []);

  if (!timeline) return <Layout><div className="text-center text-[#7A6F66] py-20">Tending the garden…</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto" data-testid="garden-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Your Garden</p>
        <h1 className="font-serif text-5xl text-[#1F2A24] mb-3">A timeline of small petals</h1>
        <p className="text-[#1F2A24]/70 mb-8 leading-relaxed">
          Every reflection, mission, and moment of bravery has shaped your tree. This is its quiet diary.
        </p>

        {/* Hero tree */}
        <div className="zen-card overflow-hidden relative mb-8" style={{ minHeight: 380 }}>
          <div className="absolute inset-0">
            <SakuraTree stage={timeline.stage} blossoms={timeline.total_blossoms} className="w-full h-full"/>
          </div>
          <div className="absolute bottom-6 left-7 right-7 flex items-end justify-between flex-wrap gap-3 z-10">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl px-4 py-3 border border-[#1F2A24]/8">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-1">Current stage</p>
              <h2 className="font-serif text-2xl text-[#1F2A24]"><TreeStageLabel stage={timeline.stage}/></h2>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl px-4 py-3 border border-[#1F2A24]/8 text-right">
              <div className="font-serif text-3xl text-[#E68AA1]">{timeline.total_blossoms}</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66]">blossoms</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {timeline.events.length === 0 ? (
          <div className="zen-card p-12 text-center" data-testid="garden-empty">
            <Flower2 className="w-7 h-7 mx-auto text-[#E68AA1] mb-3" strokeWidth={1.5}/>
            <p className="font-serif text-2xl text-[#1F2A24] mb-1">The garden waits for you</p>
            <p className="text-sm text-[#7A6F66]">Mood dumps, journals, missions — each grows your tree.</p>
          </div>
        ) : (
          <ol className="relative space-y-3" data-testid="timeline-list">
            <span className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-[#E68AA1]/50 via-[#B89668]/40 to-transparent"/>
            {timeline.events.map((ev, i) => {
              if (ev.type === "stage") {
                return (
                  <li key={i} className="relative pl-12 animate-fade-up" data-testid={`milestone-${ev.stage}`}>
                    <span className="absolute left-0 top-2 w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #FFE9A8, #B89668)", boxShadow: "0 0 24px rgba(184,150,104,0.5)" }}>
                      <Sparkles className="w-4 h-4 text-white" strokeWidth={2}/>
                    </span>
                    <div className="zen-card p-5"
                         style={{ background: "linear-gradient(135deg, rgba(255,233,168,0.35), rgba(250,247,241,0.85))",
                                  border: "1px solid rgba(184,150,104,0.3)" }}>
                      <p className="text-[10px] tracking-[0.3em] uppercase text-[#B89668] mb-1">Milestone · blossom {ev.blossom_no}</p>
                      <p className="font-serif text-xl text-[#1F2A24] italic">{STAGE_LABELS[ev.stage] || ev.title} 🌸</p>
                      <p className="text-xs text-[#7A6F66] mt-1">{new Date(ev.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </li>
                );
              }
              const meta = KIND_META[ev.kind] || { icon: Flower2, accent: "#E68AA1", label: "Petal" };
              const Icon = meta.icon;
              return (
                <li key={i} className="relative pl-12" data-testid={`event-${i}`}>
                  <span className="absolute left-0 top-2 w-9 h-9 rounded-full flex items-center justify-center bg-white border"
                        style={{ borderColor: `${meta.accent}40`, color: meta.accent }}>
                    <Icon className="w-4 h-4" strokeWidth={1.75}/>
                  </span>
                  <div className="zen-card p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66]">{meta.label}</p>
                      <p className="font-serif text-[#1F2A24] truncate">{ev.hint || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#7A6F66]">{new Date(ev.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] text-[#E68AA1] tracking-[0.2em] uppercase">+1 blossom</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Layout>
  );
}
