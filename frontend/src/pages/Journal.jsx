import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Journal() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState([]);

  const loadPrompts = async () => {
    setRefreshing(true);
    try {
      const r = await client.get("/journal/prompts");
      setPrompts(r.data || []);
    } finally { setRefreshing(false); }
  };
  const loadEntries = async () => {
    const r = await client.get("/journal/entries");
    setEntries(r.data || []);
  };

  useEffect(() => { loadPrompts(); loadEntries(); }, []);

  const submit = async () => {
    if (!selectedPrompt || !response.trim()) return;
    setLoading(true);
    try {
      await client.post("/journal/entries", { prompt: selectedPrompt.prompt, response });
      setResponse(""); setSelectedPrompt(null);
      await loadEntries();
      toast.success("A new blossom on your tree 🌸");
    } catch { toast.error("Could not save"); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto" data-testid="journal-page">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82]">AI Journal</p>
          <button onClick={loadPrompts} disabled={refreshing} className="text-sm text-[#E68AA1] hover:underline inline-flex items-center gap-1" data-testid="journal-refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}/> new prompts
          </button>
        </div>
        <h1 className="font-serif text-5xl mb-3">Today's whispers</h1>
        <p className="text-[#2D1B22]/70 mb-8 leading-relaxed">
          A gentle prompt to sit with. Pick one that feels true today.
        </p>

        {!selectedPrompt ? (
          <div className="grid md:grid-cols-3 gap-5" data-testid="prompt-cards">
            {prompts.map((p, i) => (
              <button key={i} onClick={() => setSelectedPrompt(p)}
                      className="zen-card p-7 text-left hover:-translate-y-1 transition-transform group">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3"/> {p.category}
                </p>
                <p className="font-serif text-xl text-[#2D1B22] leading-snug">{p.prompt}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="zen-card p-8 animate-fade-up">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mb-2">{selectedPrompt.category}</p>
            <p className="font-serif text-2xl mb-6">{selectedPrompt.prompt}</p>
            <textarea className="input-zen min-h-[200px] bg-white/60"
                      placeholder="Take your time..."
                      value={response} onChange={e => setResponse(e.target.value)} data-testid="journal-textarea"/>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setSelectedPrompt(null); setResponse(""); }} className="btn-ghost" data-testid="journal-cancel">Cancel</button>
              <button onClick={submit} disabled={loading || !response.trim()} className="btn-primary" data-testid="journal-save">
                {loading ? "Saving..." : "Save entry"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-14">
          <h2 className="font-serif text-2xl mb-5 text-[#2D1B22]/70">Previous entries</h2>
          <div className="space-y-4" data-testid="journal-history">
            {entries.length === 0 && <p className="text-[#8A7E82] text-sm">No entries yet. Begin when you're ready.</p>}
            {entries.map(e => (
              <div key={e.id} className="zen-card p-6">
                <p className="font-serif text-lg text-[#E68AA1] mb-2">{e.prompt}</p>
                <p className="text-[#2D1B22]/80 leading-relaxed">{e.response}</p>
                <p className="text-xs text-[#8A7E82] mt-3">
                  {new Date(e.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
