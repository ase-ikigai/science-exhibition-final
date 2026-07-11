import React, { useEffect, useRef, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import {
  Sparkles, Send, Mic, MicOff, ImageIcon, X, Heart, Cloud, Lightbulb, Compass, Wind, Brain, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const AREAS = ["School", "Friends", "Family", "Health", "Confidence", "Purpose", "Hobbies"];

export default function MoodDump() {
  const [text, setText] = useState("");
  const [areas, setAreas] = useState([]);
  const [imageB64, setImageB64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [listening, setListening] = useState(false);
  const [fresh, setFresh] = useState(null); // last reflected entry to show prominently
  const [tab, setTab] = useState("mood"); // "mood", "thoughts", or "notokay"
  const [negativethought, setNegativethought] = useState("");
  const [cbtItems, setCbtItems] = useState([]);
  const [notOkayProblem, setNotOkayProblem] = useState("");
  const [notOkayContext, setNotOkayContext] = useState("");
  const [notOkayItems, setNotOkayItems] = useState([]);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recRef = useRef(null);
  const fileRef = useRef(null);
  const freshRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice not supported in this browser"); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(prev => (prev ? prev + " " : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start(); recRef.current = rec; setListening(true);
  };

  const onImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Please pick an image under 4MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setImagePreview(url);
      setImageB64(url);
    };
    reader.readAsDataURL(f);
  };

  const clearImage = () => { setImageB64(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const toggleArea = (a) => {
    setAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const load = async () => {
    const r = await client.get("/mood-dump");
    setItems(r.data || []);
  };

  const loadCbt = async () => {
    try {
      const r = await client.get("/mood-dump/negative-thoughts");
      setCbtItems(r.data || []);
    } catch (e) {
      console.error("Failed to load CBT items");
    }
  };

  const loadNotOkay = async () => {
    try {
      const r = await client.get("/mood-dump/im-not-okay");
      setNotOkayItems(r.data || []);
    } catch (e) {
      console.error("Failed to load not okay items");
    }
  };

  useEffect(() => { 
    load();
    loadCbt();
    loadNotOkay();
  }, []);

  const submit = async () => {
    if (!text.trim() && !imageB64) {
      toast.error("Add a few words, your voice, or a photo");
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post("/mood-dump", { text, areas, image_base64: imageB64 });
      setLoading(false);
      setFresh(data);
      setText(""); setAreas([]); clearImage();
      load();
      setTimeout(() => freshRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      toast.success("A petal noted 🌸");
    } catch {
      setLoading(false);
      toast.error("Could not save");
    }
  };

  const submitNegativeThought = async () => {
    if (!negativethought.trim()) {
      toast.error("Share the negative thought with me");
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post("/mood-dump/negative-thoughts", { thought: negativethought });
      setLoading(false);
      setFresh(data);
      setNegativethought("");
      loadCbt();
      setTimeout(() => freshRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      toast.success("Let's reframe that 🌸");
    } catch {
      setLoading(false);
      toast.error("Could not analyze");
    }
  };

  const submitNotOkay = async () => {
    if (!notOkayProblem.trim()) {
      toast.error("Tell me what's going on");
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post("/mood-dump/im-not-okay", {
        text: notOkayProblem,
        areas: notOkayContext ? [notOkayContext] : [],
      });
      setLoading(false);
      setFresh(data);
      setNotOkayProblem("");
      setNotOkayContext("");
      loadNotOkay();
      setTimeout(() => freshRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      toast.success("I'm here with you 🌸");
    } catch {
      setLoading(false);
      toast.error("Could not process");
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto" data-testid="mood-dump-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Mood Dump</p>
        <h1 className="font-serif text-5xl mb-3 text-[#1F2A24]">Let it spill, gently</h1>
        <p className="text-[#1F2A24]/70 mb-8 leading-relaxed">
          Words, voice, or a photo — let your inner weather out. IKIGAI will reflect it back, gently and specifically.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => { setTab("mood"); setFresh(null); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              tab === "mood"
                ? "bg-[#E68AA1] text-white"
                : "bg-white/70 text-[#1F2A24]/70 hover:bg-white"
            }`}
          >
            <Wind className="w-4 h-4 inline mr-2" />
            General Mood
          </button>
          <button
            onClick={() => { setTab("thoughts"); setFresh(null); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              tab === "thoughts"
                ? "bg-[#B89668] text-white"
                : "bg-white/70 text-[#1F2A24]/70 hover:bg-white"
            }`}
          >
            <Brain className="w-4 h-4 inline mr-2" />
            Negative Thoughts
          </button>
          <button
            onClick={() => setTab("notokay")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              tab === "notokay"
                ? "bg-[#D8A6A6] text-white"
                : "bg-white/70 text-[#1F2A24]/70 hover:bg-white"
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            I'm Not Okay
          </button>
        </div>

        {tab === "mood" ? (
          <>
            {/* Voice-first Composer - Mood Tab */}
            <div className="zen-card p-8 sm:p-10 text-center" data-testid="voice-composer">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">
                {listening ? "Listening…" : (text ? "Tap to keep going or stop" : "Tap and speak — IKIGAI will listen")}
              </p>
              <h3 className="font-serif text-2xl text-[#1F2A24] mb-7">
                {listening ? <span className="italic text-[#E68AA1]">say it out loud</span> : "What's on your mind?"}
              </h3>

              {/* Big voice button */}
              <div className="relative mx-auto mb-7" style={{ width: 168, height: 168 }}>
                {listening && (
                  <>
                    <span className="absolute inset-0 rounded-full pointer-events-none"
                          style={{ background: "rgba(230,138,161,0.18)", animation: "bloom-pulse 1.6s ease-in-out infinite" }}/>
                    <span className="absolute -inset-3 rounded-full pointer-events-none"
                          style={{ background: "rgba(230,138,161,0.10)", animation: "bloom-pulse 2.4s ease-in-out infinite" }}/>
                  </>
                )}
                <button onClick={toggleVoice} type="button" data-testid="voice-toggle"
                        aria-label={listening ? "Stop recording" : "Start recording"}
                        className={`absolute inset-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                          listening ? "shadow-2xl" : "shadow-xl hover:shadow-2xl hover:scale-105"
                        }`}
                        style={{
                          background: listening
                            ? "linear-gradient(135deg, #E68AA1, #B6678A)"
                            : "linear-gradient(135deg, #F5D2DD, #E68AA1)",
                          border: "3px solid rgba(250,247,241,0.85)",
                        }}>
                  {listening ? <MicOff className="w-16 h-16 text-white" strokeWidth={1.5}/> : <Mic className="w-16 h-16 text-white" strokeWidth={1.5}/>}
                </button>
              </div>

              {/* Live transcript */}
              {text && (
                <div className="text-left max-w-xl mx-auto bg-white/55 rounded-2xl p-5 mb-5 animate-fade-up" data-testid="voice-transcript">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-2 flex items-center justify-between">
                    <span>What IKIGAI hears</span>
                    <button onClick={() => setText("")} type="button" data-testid="clear-transcript"
                            className="text-[#7A6F66]/70 hover:text-[#E68AA1] transition normal-case tracking-normal text-xs">
                      clear
                    </button>
                  </p>
                  <p className="font-serif text-lg text-[#1F2A24] leading-relaxed italic">"{text}"</p>
                </div>
              )}

              {/* Voice not supported fallback */}
              {!voiceSupported && (
                <div className="max-w-xl mx-auto bg-[#E68AA1]/10 border border-[#E68AA1]/20 rounded-2xl p-4 mb-5 text-left" data-testid="voice-fallback">
                  <p className="text-xs text-[#7A6F66] mb-2">
                    Voice isn't available in this browser. You can still type below — when you're ready.
                  </p>
                  <textarea
                    className="w-full min-h-[100px] bg-white/70 rounded-xl p-3 resize-none outline-none placeholder-[#7A6F66] text-[#1F2A24] leading-relaxed font-serif"
                    placeholder="It's okay. Just one sentence is enough."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    data-testid="mood-textarea-fallback"
                  />
                </div>
              )}

              {/* Image preview */}
              {imagePreview && (
                <div className="relative max-w-md mx-auto mb-5 animate-fade-up">
                  <img src={imagePreview} alt="mood" className="rounded-2xl max-h-56 object-cover w-full"/>
                  <button onClick={clearImage} type="button" data-testid="mood-image-remove"
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-[#1F2A24]/70 text-white hover:bg-[#1F2A24] transition">
                    <X className="w-3.5 h-3.5"/>
                  </button>
                </div>
              )}

              {/* Areas (optional context) */}
              <div className="pt-4 mt-3 border-t border-[#1F2A24]/8">
                <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-3">What is this about? (optional)</p>
                <div className="flex flex-wrap gap-2 justify-center" data-testid="mood-areas">
                  {AREAS.map(a => {
                    const active = areas.includes(a);
                    return (
                      <button key={a} type="button" onClick={() => toggleArea(a)}
                        className={`px-3.5 py-1.5 rounded-full text-xs border transition-all active:scale-95 ${
                          active
                            ? 'bg-[#2D3F36] text-[#FAF7F1] border-[#2D3F36]'
                            : 'bg-white/60 border-[#1F2A24]/15 text-[#1F2A24]/70 hover:border-[#1F2A24]/40'
                        }`}>{a}</button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap justify-center items-center mt-6 gap-3">
                <button onClick={() => fileRef.current?.click()} type="button" data-testid="mood-image-pick"
                        className="p-2.5 rounded-full bg-white/70 text-[#1F2A24]/70 hover:bg-white transition active:scale-95" title="Photo">
                  <ImageIcon className="w-4 h-4"/>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage}/>
                <button onClick={submit} disabled={loading || (!text.trim() && !imageB64)}
                        className="btn-primary inline-flex items-center gap-2 active:scale-95 transition disabled:opacity-50"
                        data-testid="mood-submit">
                  <Send className="w-3.5 h-3.5"/> {loading ? "Reflecting…" : "Reflect"}
                </button>
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F66] mt-4">
                {imageB64 ? "photo attached · " : ""}
                {text ? `${text.split(/\s+/).filter(Boolean).length} words spoken` : "no words yet"}
              </p>
            </div>
          </>
        ) : tab === "thoughts" ? (
          <>
            {/* Negative Thoughts Tab */}
            <div className="zen-card p-6 hover:-translate-y-0.5 transition-transform bg-gradient-to-br from-[#FAF7F1] to-white">
              <div className="mb-4 p-4 rounded-lg bg-[#B89668]/10 border border-[#B89668]/20">
                <div className="flex gap-3">
                  <Brain className="w-5 h-5 text-[#B89668] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#B89668] mb-1">Cognitive Behavioral Therapy</p>
                    <p className="text-xs text-[#1F2A24]/70">Share a negative thought and let's gently challenge it together using CBT techniques.</p>
                  </div>
                </div>
              </div>
              <textarea
                className="w-full min-h-[140px] bg-white/70 resize-none outline-none placeholder-[#7A6F66] text-[#1F2A24] leading-relaxed font-serif text-lg p-4 rounded-lg border border-[#1F2A24]/10"
                placeholder="I'm not good enough… I always mess up… I can't do this…"
                value={negativethought}
                onChange={e => setNegativethought(e.target.value)}
              />
              <div className="flex justify-between items-center mt-5">
                <span className="text-xs text-[#7A6F66]">{negativethought.length} chars</span>
                <button 
                  onClick={submitNegativeThought} 
                  disabled={loading || !negativethought.trim()}
                  className="btn-primary inline-flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-3.5 h-3.5"/> {loading ? "Analyzing…" : "Reframe"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* I'm Not Okay Tab */}
            <div className="zen-card p-6 hover:-translate-y-0.5 transition-transform bg-gradient-to-br from-[#FAF7F1] to-white">
              <div className="mb-4 p-4 rounded-lg bg-[#D8A6A6]/10 border border-[#D8A6A6]/20">
                <div className="flex gap-3">
                  <Heart className="w-5 h-5 text-[#D8A6A6] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#D8A6A6] mb-1">I'm Not Okay</p>
                    <p className="text-xs text-[#1F2A24]/70">Share what's happening. I'll listen and help you find your footing.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-[#7A6F66] mb-2 block">What's troubling you?</label>
                  <textarea
                    className="w-full min-h-[120px] bg-white/70 resize-none outline-none placeholder-[#7A6F66] text-[#1F2A24] leading-relaxed font-serif text-lg p-4 rounded-lg border border-[#1F2A24]/10"
                    placeholder="I'm struggling with…"
                    value={notOkayProblem}
                    onChange={e => setNotOkayProblem(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-[#7A6F66] mb-2 block">More context? (optional)</label>
                  <textarea
                    className="w-full min-h-[80px] bg-white/70 resize-none outline-none placeholder-[#7A6F66] text-[#1F2A24] leading-relaxed text-sm p-4 rounded-lg border border-[#1F2A24]/10"
                    placeholder="Background, how long this has been going on, who knows…"
                    value={notOkayContext}
                    onChange={e => setNotOkayContext(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-5">
                <span className="text-xs text-[#7A6F66]">{notOkayProblem.length} chars</span>
                <button 
                  onClick={submitNotOkay} 
                  disabled={loading || !notOkayProblem.trim()}
                  className="btn-primary inline-flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Heart className="w-3.5 h-3.5"/> {loading ? "Listening…" : "Share"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Loading state — gentle skeleton */}
        {loading && (
          <div className="mt-10 zen-card p-8 animate-pulse" data-testid="mood-loading">
            <div className="h-3 w-24 bg-[#1F2A24]/10 rounded-full mb-3"/>
            <div className="h-6 w-72 bg-[#1F2A24]/10 rounded-full mb-4"/>
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#1F2A24]/8 rounded-full"/>
              <div className="h-3 w-5/6 bg-[#1F2A24]/8 rounded-full"/>
              <div className="h-3 w-4/6 bg-[#1F2A24]/8 rounded-full"/>
            </div>
          </div>
        )}

        {/* Fresh card — use the right card per tab */}
        {fresh && !loading && (
          <div ref={freshRef} className="mt-10" data-testid="mood-fresh">
            {tab === "mood"     && <ReflectionCard item={fresh} highlight/>}
            {tab === "thoughts" && <CBTCard item={fresh} highlight/>}
            {tab === "notokay"  && <NotOkayCard item={fresh} highlight/>}
          </div>
        )}

        {/* Past dumps or thoughts */}
        <div className="mt-12">
          {!loading && (
            tab === "mood" ? items.length === 0 : 
            tab === "thoughts" ? cbtItems.length === 0 : 
            notOkayItems.length === 0
          ) && (
            <div className="zen-card p-12 text-center" data-testid="mood-empty">
              <Wind className="w-7 h-7 mx-auto text-[#E68AA1] mb-3" strokeWidth={1.5}/>
              <p className="font-serif text-2xl text-[#1F2A24] mb-1">Your sanctuary is still</p>
              <p className="text-sm text-[#7A6F66]">Drop your first {tab === "mood" ? "thought" : tab === "thoughts" ? "negative thought" : "concern"} — IKIGAI will start listening from your very first word.</p>
            </div>
          )}
          {(
            tab === "mood" ? items.length > 0 : 
            tab === "thoughts" ? cbtItems.length > 0 : 
            notOkayItems.length > 0
          ) && (
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-4">
              {tab === "mood" ? "Past Reflections" : tab === "thoughts" ? "Reframed Thoughts" : "Your Journey"}
            </p>
          )}
          <div className="space-y-5" data-testid="mood-history">
            {tab === "mood" ? (
              items
                .filter(it => !fresh || it.id !== fresh.id)
                .map(item => <ReflectionCard key={item.id} item={item}/>)
            ) : tab === "thoughts" ? (
              cbtItems
                .filter(it => !fresh || it.id !== fresh.id)
                .map(item => <CBTCard key={item.id} item={item}/>)
            ) : (
              notOkayItems
                .filter(it => !fresh || it.id !== fresh.id)
                .map(item => <NotOkayCard key={item.id} item={item}/>)
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const ReflectionCard = ({ item, highlight = false }) => {
  const a = item.analysis || {};
  const themes = a.themes || a.emotions || [];
  const concerns = a.concerns || [];
  const causes = a.causes || [];
  const perspective = a.perspective || a.insight || "";
  const action = a.action || a.suggestion || "";
  const validation = a.validation || a.reflection || "";

  return (
    <div className={`zen-card overflow-hidden animate-fade-up transition-all ${highlight ? 'ring-1 ring-[#E68AA1]/30 shadow-xl' : ''}`}>
      {highlight && (
        <div className="px-7 py-2 text-[10px] tracking-[0.3em] uppercase text-[#B89668] border-b border-[#1F2A24]/8"
             style={{ background: "linear-gradient(90deg, rgba(245,210,221,0.4), rgba(250,247,241,0))" }}>
          A New Reflection · {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
      <div className="p-7">
        {/* Themes & areas */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {themes.slice(0, 3).map((e, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,210,221,0.55), rgba(255,247,233,0.55))",
                      borderColor: "rgba(230,138,161,0.3)", color: "#1F2A24"
                    }}>
                {e}
              </span>
            ))}
            {(item.areas || []).map((a, i) => (
              <span key={`a-${i}`} className="px-3 py-1 rounded-full text-xs border border-[#1F2A24]/15 text-[#1F2A24]/65 bg-white/60">
                {a}
              </span>
            ))}
            {item.has_image && (
              <span className="px-2.5 py-1 rounded-full text-[10px] tracking-[0.15em] uppercase border border-[#B89668]/40 text-[#B89668] bg-[#B89668]/8">
                photo
              </span>
            )}
          </div>
          {!highlight && (
            <span className="text-xs text-[#7A6F66]">
              {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* The user's words */}
        {item.text && (
          <p className="text-[#1F2A24]/85 leading-relaxed mb-6 italic font-serif text-lg">&ldquo;{item.text}&rdquo;</p>
        )}

        {/* 5-part premium analysis */}
        <div className="space-y-4 pt-5 border-t border-[#1F2A24]/8">
          {validation && (
            <InsightRow icon={Heart} accent="#E68AA1" label="What I'm hearing" text={validation}/>
          )}
          {concerns.length > 0 && (
            <InsightList icon={Cloud} accent="#B5B5DC" label="Main concerns" items={concerns}/>
          )}
          {causes.length > 0 && (
            <InsightList icon={Compass} accent="#B89668" label="What may be underneath" items={causes}/>
          )}
          {perspective && (
            <InsightRow icon={Lightbulb} accent="#7AA37A" label="A helpful perspective" text={perspective}/>
          )}
          {action && (
            <div className="mt-4 p-4 rounded-2xl"
                 style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.35), rgba(255,247,233,0.55))",
                          border: "1px solid rgba(230,138,161,0.25)" }}>
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 mt-1 shrink-0 text-[#E68AA1]" strokeWidth={1.5}/>
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] mb-1">A small step today</p>
                  <p className="font-serif text-lg text-[#1F2A24] leading-snug">{action}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InsightRow = ({ icon: Icon, accent, label, text }) => (
  <div className="flex items-start gap-3">
    <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${accent}15`, color: accent }}>
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75}/>
    </span>
    <div>
      <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-0.5">{label}</p>
      <p className="text-[#1F2A24]/85 leading-relaxed">{text}</p>
    </div>
  </div>
);

const InsightList = ({ icon: Icon, accent, label, items }) => (
  <div className="flex items-start gap-3">
    <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${accent}15`, color: accent }}>
      <Icon className="w-3.5 h-3.5" strokeWidth={1.75}/>
    </span>
    <div className="flex-1">
      <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-1.5">{label}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-[#1F2A24]/85 leading-relaxed flex gap-2">
            <span className="text-[#7A6F66] shrink-0">·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const CBTCard = ({ item, highlight = false }) => {
  const a = item.analysis || {};
  const originalThought = item.thought || "";
  const cbtType = a.thought_pattern || "Cognitive Distortion";
  const challenge = a.challenge || "";
  const reframe = a.reframe || "";
  const evidence = a.evidence_for || [];
  const evidence_against = a.evidence_against || [];

  return (
    <div className={`zen-card overflow-hidden animate-fade-up transition-all ${highlight ? 'ring-1 ring-[#B89668]/30 shadow-xl' : ''}`}>
      {highlight && (
        <div className="px-7 py-2 text-[10px] tracking-[0.3em] uppercase text-[#E68AA1] border-b border-[#1F2A24]/8"
             style={{ background: "linear-gradient(90deg, rgba(184,150,104,0.2), rgba(250,247,241,0))" }}>
          Thought Reframed · {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
      <div className="p-7">
        {/* Original thought */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] mb-2">Your Thought</p>
          <p className="text-lg font-serif text-[#1F2A24] italic">&ldquo;{originalThought}&rdquo;</p>
        </div>

        {/* CBT Analysis */}
        <div className="space-y-4 pt-5 border-t border-[#1F2A24]/8">
          {cbtType && (
            <div className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-[0.15em] uppercase border-2 border-[#B89668]/40 text-[#B89668] bg-[#B89668]/15">
              {cbtType}
            </div>
          )}

          {challenge && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#B89668]/10 border border-[#B89668]/25">
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "#B8966825", color: "#B89668" }}>
                <Brain className="w-4 h-4" strokeWidth={2}/>
              </span>
              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-[#B89668] font-semibold mb-1">Question it gently</p>
                <p className="text-[#1F2A24]/85 leading-relaxed font-medium">{challenge}</p>
              </div>
            </div>
          )}

          {(evidence.length > 0 || evidence_against.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidence.length > 0 && (
                <InsightList icon={Lightbulb} accent="#7AA37A" label="Evidence for it" items={evidence}/>
              )}
              {evidence_against.length > 0 && (
                <InsightList icon={Compass} accent="#E68AA1" label="Evidence against it" items={evidence_against}/>
              )}
            </div>
          )}

          {reframe && (
            <div className="mt-6 p-6 rounded-3xl"
                 style={{ background: "linear-gradient(135deg, rgba(122,163,122,0.35), rgba(184,150,104,0.25))",
                          border: "2px solid rgba(122,163,122,0.5)", boxShadow: "0 8px 24px rgba(122,163,122,0.15)" }}>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: "rgba(122,163,122,0.3)" }}>
                  <Sparkles className="w-5 h-5 text-[#7AA37A]" strokeWidth={1.5}/>
                </div>
                <div className="flex-1">
                  <p className="text-xs tracking-[0.3em] uppercase font-semibold text-[#7AA37A] mb-2 flex items-center gap-1.5">
                    ✨ A kinder truth
                  </p>
                  <p className="font-serif text-xl text-[#1F2A24] leading-relaxed font-semibold">{reframe}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NotOkayCard = ({ item, highlight = false }) => {
  const a = item.analysis || {};
  const problem = item.problem || "";
  const validation = a.validation || "";
  const questions = a.questions || [];
  const todayActions = a.today_actions || [];
  const habitSuggestion = a.habit_suggestion || "";
  const reminder = a.reminder || "";

  return (
    <div className={`zen-card overflow-hidden animate-fade-up transition-all ${highlight ? 'ring-1 ring-[#D8A6A6]/30 shadow-xl' : ''}`}>
      {highlight && (
        <div className="px-7 py-2 text-[10px] tracking-[0.3em] uppercase text-[#D8A6A6] border-b border-[#1F2A24]/8"
             style={{ background: "linear-gradient(90deg, rgba(216,166,166,0.2), rgba(250,247,241,0))" }}>
          Support Offered · {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
      )}
      <div className="p-7">
        {/* Their problem */}
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#D8A6A6] mb-2">What You Shared</p>
          <p className="text-lg font-serif text-[#1F2A24] italic">&ldquo;{problem}&rdquo;</p>
        </div>

        {/* Support */}
        <div className="space-y-4 pt-5 border-t border-[#1F2A24]/8">
          {validation && (
            <InsightRow icon={Heart} accent="#D8A6A6" label="I hear you" text={validation}/>
          )}

          {questions.length > 0 && (
            <InsightList icon={Compass} accent="#B89668" label="Let's understand more" items={questions}/>
          )}

          {todayActions.length > 0 && (
            <InsightList icon={Sparkles} accent="#7AA37A" label="Small steps for today" items={todayActions}/>
          )}

          {habitSuggestion && (
            <div className="p-4 rounded-2xl"
                 style={{ background: "linear-gradient(135deg, rgba(184,150,104,0.15), rgba(122,163,122,0.15))",
                          border: "1px solid rgba(184,150,104,0.25)" }}>
              <div className="flex items-start gap-3">
                <Lightbulb className="w-4 h-4 mt-1 shrink-0 text-[#B89668]" strokeWidth={1.5}/>
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] mb-1">A practice for the journey</p>
                  <p className="font-serif text-lg text-[#1F2A24] leading-snug">{habitSuggestion}</p>
                </div>
              </div>
            </div>
          )}

          {reminder && (
            <div className="p-4 rounded-2xl bg-[#D8A6A6]/8 border border-[#D8A6A6]/20">
              <p className="text-sm italic text-[#1F2A24]">{reminder}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
