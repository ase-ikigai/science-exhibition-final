import React, { useEffect, useState, useRef } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Sparkles, RefreshCw, PenLine, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const MOODS = ["Grateful", "Anxious", "Hopeful", "Tired", "Confused", "Peaceful", "Angry", "Sad", "Excited", "Numb"];

export default function Journal() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const textRef = useRef(null);

  const loadEntries = async () => {
    try {
      const r = await client.get("/journal/entries");
      setEntries(r.data || []);
    } catch {}
  };

  const fetchPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const r = await client.get("/journal/prompts");
      setPrompts(r.data || []);
    } finally { setLoadingPrompts(false); }
  };

  useEffect(() => { loadEntries(); }, []);

  const togglePrompts = async () => {
    if (!showPrompts && prompts.length === 0) await fetchPrompts();
    setShowPrompts(p => !p);
  };

  const pickPrompt = (p) => {
    setSelectedPrompt(p);
    setShowPrompts(false);
    setTimeout(() => textRef.current?.focus(), 80);
  };

  const clearPrompt = () => { setSelectedPrompt(null); };

  const save = async () => {
    if (!text.trim()) { toast.error("Write at least a few words first"); return; }
    setLoading(true);
    try {
      await client.post("/journal/entries", {
        prompt: selectedPrompt?.prompt || "",
        response: text,
        mood,
      });
      setText(""); setMood(""); setSelectedPrompt(null);
      await loadEntries();
      toast.success("Saved to your journal 🌸");
    } catch { toast.error("Could not save"); }
    finally { setLoading(false); }
  };

  const groupedEntries = entries.reduce((acc, e) => {
    const date = new Date(e.created_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto" data-testid="journal-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Your Journal</p>
        <h1 className="font-serif text-5xl mb-1 text-[#1F2A24]">Write freely.</h1>
        <p className="text-[#1F2A24]/60 mb-8 text-sm">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · Good {greeting}, {user?.name?.split(" ")[0]}.
        </p>

        {/* Write area */}
        <div className="zen-card overflow-hidden mb-3" data-testid="journal-composer">
          {selectedPrompt && (
            <div className="px-7 pt-6 pb-0 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#B89668] mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3"/> {selectedPrompt.category}
                </p>
                <p className="font-serif text-lg text-[#1F2A24] italic">"{selectedPrompt.prompt}"</p>
              </div>
              <button onClick={clearPrompt} className="shrink-0 p-1 rounded-full text-[#7A6F66] hover:text-[#E68AA1] transition mt-1">
                <X className="w-4 h-4"/>
              </button>
            </div>
          )}

          <textarea
            ref={textRef}
            className="w-full bg-transparent border-none outline-none resize-none p-7 font-serif text-[1.15rem] text-[#1F2A24] leading-[1.9] placeholder-[#7A6F66]/40"
            style={{ minHeight: 220 }}
            placeholder={selectedPrompt ? "Take your time…" : "What's on your mind today? Write anything — thoughts, feelings, what happened, what you're worried about…"}
            value={text}
            onChange={e => setText(e.target.value)}
            data-testid="journal-textarea"
          />

          {/* Bottom bar */}
          <div className="px-7 pb-6 border-t border-[#1F2A24]/6 pt-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button key={m} type="button" onClick={() => setMood(mood === m ? "" : m)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    mood === m
                      ? "bg-[#E68AA1] text-white border-[#E68AA1]"
                      : "bg-white/60 border-[#1F2A24]/12 text-[#7A6F66] hover:border-[#E68AA1]/50"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-[10px] text-[#7A6F66]">{text.split(/\s+/).filter(Boolean).length} words</span>
              <button onClick={save} disabled={loading || !text.trim()}
                className="btn-primary active:scale-95 transition disabled:opacity-50 py-2.5 px-5"
                data-testid="journal-save">
                {loading ? "Saving…" : "Save entry"}
              </button>
            </div>
          </div>
        </div>

        {/* Prompt toggle */}
        <button onClick={togglePrompts} className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#B89668] hover:text-[#1F2A24] transition mb-8" data-testid="journal-prompt-toggle">
          <Sparkles className="w-3.5 h-3.5"/>
          {showPrompts ? "Hide prompts" : "Need a prompt? Let IKIGAI inspire you"}
          {showPrompts ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
        </button>

        {showPrompts && (
          <div className="mb-8 animate-fade-up" data-testid="prompt-panel">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66]">Today's prompts</p>
              <button onClick={fetchPrompts} disabled={loadingPrompts}
                className="text-xs text-[#E68AA1] hover:underline inline-flex items-center gap-1"
                data-testid="journal-refresh">
                <RefreshCw className={`w-3 h-3 ${loadingPrompts ? "animate-spin" : ""}`}/> Refresh
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4" data-testid="prompt-cards">
              {loadingPrompts && (
                <div className="col-span-3 text-center py-8 text-[#7A6F66] text-sm">Fetching prompts…</div>
              )}
              {!loadingPrompts && prompts.map((p, i) => (
                <button key={i} onClick={() => pickPrompt(p)}
                  className="zen-card p-5 text-left hover:-translate-y-1 transition-transform group">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#B89668] mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3"/> {p.category}
                  </p>
                  <p className="font-serif text-base text-[#1F2A24] leading-snug">{p.prompt}</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[#7A6F66] mt-3 group-hover:text-[#E68AA1] transition">
                    Use this →
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Past entries */}
        <div className="mt-4" data-testid="journal-history">
          {entries.length === 0 ? (
            <div className="zen-card p-12 text-center">
              <PenLine className="w-7 h-7 mx-auto text-[#E68AA1] mb-3" strokeWidth={1.5}/>
              <p className="font-serif text-2xl text-[#1F2A24] mb-1">Your first page</p>
              <p className="text-sm text-[#7A6F66]">Everything you write here is private and yours alone.</p>
            </div>
          ) : (
            Object.entries(groupedEntries).map(([date, dayEntries]) => (
              <div key={date} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-[#1F2A24]/8"/>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66]">{date}</p>
                  <div className="h-px flex-1 bg-[#1F2A24]/8"/>
                </div>
                <div className="space-y-4">
                  {dayEntries.map(e => (
                    <JournalEntry key={e.id} entry={e}/>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

const JournalEntry = ({ entry }) => {
  const time = new Date(entry.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="journal-page zen-card overflow-hidden" data-testid="journal-entry">
      <div className="journal-lines p-7 pb-6">
        {entry.prompt && (
          <p className="font-serif italic text-[#E68AA1] text-base mb-3 leading-snug">"{entry.prompt}"</p>
        )}
        <p className="font-serif text-[1.05rem] text-[#1F2A24] leading-[1.95] whitespace-pre-wrap">{entry.response}</p>
      </div>
      <div className="px-7 pb-5 flex items-center justify-between">
        {entry.mood ? (
          <span className="px-2.5 py-1 rounded-full text-[10px] border border-[#E68AA1]/30 text-[#E68AA1] bg-[#E68AA1]/6">
            {entry.mood}
          </span>
        ) : <span/>}
        <p className="text-[10px] text-[#7A6F66]">{time}</p>
      </div>
    </div>
  );
};
