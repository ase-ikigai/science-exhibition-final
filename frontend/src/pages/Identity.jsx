import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Sparkles, Plus, X, Wand2 } from "lucide-react";
import { toast } from "sonner";

const SECTIONS = [
  { key: "strengths", title: "Strengths", subtitle: "What you carry within", accent: "#E68AA1" },
  { key: "interests", title: "Interests", subtitle: "What lights you up", accent: "#FFB7C5" },
  { key: "values", title: "Values", subtitle: "What you stand for", accent: "#B5B5DC" },
  { key: "longterm", title: "Long-term", subtitle: "Where you're heading", accent: "#7AA37A" },
];

export default function Identity() {
  const [data, setData] = useState({ strengths: [], interests: [], values: [], longterm: [] });
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [editing, setEditing] = useState(null); // section key
  const [newItem, setNewItem] = useState("");

  const load = async () => {
    const { data } = await client.get("/identity");
    setData({
      strengths: data.strengths || [],
      interests: data.interests || [],
      values: data.values || [],
      longterm: data.longterm || [],
    });
  };
  useEffect(() => { load(); }, []);

  const save = async (key, items) => {
    setData(d => ({ ...d, [key]: items }));
    try {
      await client.post("/identity", { section: key, items });
    } catch { toast.error("Could not save"); }
  };

  const addItem = (key) => {
    if (!newItem.trim()) return;
    const next = [...(data[key] || []), newItem.trim()];
    save(key, next);
    setNewItem(""); setEditing(null);
    toast.success("Planted 🌸");
  };

  const removeItem = (key, i) => {
    const next = data[key].filter((_, idx) => idx !== i);
    save(key, next);
  };

  const suggest = async () => {
    setSuggesting(true);
    try {
      const { data } = await client.post("/identity/suggest");
      setSuggestions(data);
    } catch { toast.error("Could not summon suggestions"); }
    finally { setSuggesting(false); }
  };

  const acceptSuggestion = (key, item) => {
    if (data[key].includes(item)) return;
    save(key, [...data[key], item]);
    toast.success("Added");
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto" data-testid="identity-page">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Identity Builder</p>
            <h1 className="font-serif text-5xl mb-3">Who are you becoming?</h1>
          </div>
          <button onClick={suggest} disabled={suggesting} className="btn-ghost text-sm inline-flex items-center gap-2" data-testid="identity-suggest">
            <Wand2 className="w-4 h-4"/> {suggesting ? "Listening..." : "Suggest from my journey"}
          </button>
        </div>
        <p className="text-[#2D1B22]/70 mb-10 leading-relaxed max-w-2xl">
          Ikigai means <em>reason for being</em>. Slowly map what you're made of — strengths, interests, values, and where you're heading.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {SECTIONS.map(sec => (
            <div key={sec.key} className="zen-card p-7" data-testid={`section-${sec.key}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mb-1">{sec.subtitle}</p>
                  <h3 className="font-serif text-2xl" style={{ color: sec.accent }}>{sec.title}</h3>
                </div>
                {editing !== sec.key && (
                  <button onClick={() => { setEditing(sec.key); setNewItem(""); }}
                          className="p-2 rounded-full hover:bg-white/60 text-[#E68AA1]" data-testid={`add-${sec.key}`}>
                    <Plus className="w-4 h-4"/>
                  </button>
                )}
              </div>

              {editing === sec.key && (
                <div className="mb-4 flex gap-2 animate-fade-up">
                  <input className="input-zen flex-1" placeholder={`Add a ${sec.title.toLowerCase()}...`}
                         value={newItem} onChange={e => setNewItem(e.target.value)}
                         onKeyDown={e => { if (e.key === 'Enter') addItem(sec.key); }}
                         autoFocus
                         data-testid={`input-${sec.key}`}/>
                  <button onClick={() => addItem(sec.key)} className="btn-primary text-sm" data-testid={`save-${sec.key}`}>Add</button>
                </div>
              )}

              {data[sec.key].length === 0 && editing !== sec.key && (
                <p className="text-[#8A7E82] text-sm italic">Nothing planted yet.</p>
              )}

              <ul className="flex flex-wrap gap-2">
                {data[sec.key].map((item, i) => (
                  <li key={i} className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-white/70 border" style={{ borderColor: `${sec.accent}40` }}>
                    {item}
                    <button onClick={() => removeItem(sec.key, i)} className="opacity-0 group-hover:opacity-100 transition" data-testid={`remove-${sec.key}-${i}`}>
                      <X className="w-3 h-3 text-[#8A7E82]"/>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Suggestions */}
              {suggestions && suggestions[sec.key]?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/60">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A7E82] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3"/> Whispers from your journey
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions[sec.key].map((s, i) => (
                      <button key={i} onClick={() => acceptSuggestion(sec.key, s)} data-testid={`accept-${sec.key}-${i}`}
                              className="px-3 py-1.5 rounded-full text-xs bg-white/40 border border-dashed text-[#2D1B22]/70 hover:bg-white"
                              style={{ borderColor: `${sec.accent}80` }}>
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
