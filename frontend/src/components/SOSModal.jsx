import React, { useEffect, useRef, useState } from "react";
import client from "../lib/api";
import { X, Loader2, Heart, Compass, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export const SOSModal = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const firstRef = useRef(null);

  useEffect(() => {
    setTimeout(() => firstRef.current?.focus(), 80);
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const { data } = await client.post("/mood-dump/im-not-okay", { text: message });
      const a = data.analysis || {};
      setResponse({
        acknowledge: a.validation || "Whatever's happening, IKIGAI is here.",
        right_now: a.today_actions || [],
        reframe: a.reminder || "",
        next_hour: a.habit_suggestion || "",
        reach_out: a.reach_out || "",
        safety: "",
      });
    } catch {
      setResponse({
        acknowledge: "Whatever's happening, IKIGAI is here. You don't have to be okay to be welcome.",
        right_now: ["Place a hand on your chest.", "Take three slow breaths.", "Drink a slow glass of water."],
        reframe: "This moment is enormous and it is temporary.",
        next_hour: "Wrap up in something soft and sit somewhere safe.",
        reach_out: "Someone in your life would want to know — even just one short message.",
        safety: "",
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
         data-testid="sos-modal" onClick={onClose}>
      <div className="absolute inset-0 animate-fade-up" style={{ background: "rgba(31,42,36,0.6)" }}/>

      <div className="relative w-full sm:max-w-xl bg-[#FAF7F1] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-fade-up max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        {/* Top glow */}
        <div className="absolute top-0 inset-x-0 h-40 pointer-events-none"
             style={{ background: "linear-gradient(180deg, rgba(245,210,221,0.55) 0%, rgba(250,247,241,0) 100%)" }}/>

        <button onClick={onClose} type="button" data-testid="sos-close"
                className="absolute top-4 right-4 z-10 p-2 rounded-full text-[#1F2A24]/60 hover:text-[#1F2A24] hover:bg-[#1F2A24]/5 transition active:scale-95">
          <X className="w-4 h-4"/>
        </button>

        <div className="relative p-7 sm:p-9">
          <p className="text-[10px] tracking-[0.45em] uppercase text-[#B89668] mb-2 flex items-center gap-1.5">
            <Heart className="w-3 h-3"/> A safe space
          </p>
          <h2 className="font-serif text-3xl text-[#1F2A24] mb-1" data-testid="sos-title">
            I'm not okay.
          </h2>
          <p className="text-sm text-[#7A6F66] mb-6">
            Whatever's happening — share as little or as much as you need. IKIGAI will adapt to what you share.
          </p>

          {!response && (
            <>
              <textarea ref={firstRef} value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="What's making today hard right now…"
                        className="input-zen min-h-[150px] font-serif text-base leading-relaxed mb-4"
                        data-testid="sos-textarea"/>
              <button onClick={submit} disabled={loading || !message.trim()}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60"
                      data-testid="sos-submit">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
                {loading ? "Listening…" : "Let IKIGAI hold this"}
              </button>
            </>
          )}

          {response && (
            <div className="space-y-5 animate-fade-up" data-testid="sos-response">
              {response.acknowledge && (
                <div className="p-5 rounded-2xl"
                     style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.4), rgba(255,247,233,0.4))",
                              border: "1px solid rgba(230,138,161,0.25)" }}>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] mb-1.5">What I'm hearing</p>
                  <p className="font-serif text-lg text-[#1F2A24] leading-relaxed italic">"{response.acknowledge}"</p>
                </div>
              )}

              {response.right_now && response.right_now.length > 0 && (
                <Section title="Right now (next 5 minutes)" accent="#E68AA1">
                  <ul className="space-y-2">
                    {response.right_now.map((r, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="w-6 h-6 rounded-full bg-[#E68AA1]/15 text-[#E68AA1] flex items-center justify-center text-xs shrink-0 font-medium">{i + 1}</span>
                        <span className="text-[#1F2A24]/90 leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {response.reframe && (
                <Section title="A pinhole of perspective" accent="#7AA37A">
                  <p className="font-serif italic text-[#1F2A24] leading-relaxed">"{response.reframe}"</p>
                </Section>
              )}

              {response.next_hour && (
                <Section title="Next hour" accent="#B89668">
                  <p className="text-[#1F2A24]/85 leading-relaxed">{response.next_hour}</p>
                </Section>
              )}

              {response.reach_out && (
                <Section title="Reach out" accent="#B5B5DC">
                  <p className="text-[#1F2A24]/85 leading-relaxed">{response.reach_out}</p>
                </Section>
              )}

              {response.safety && response.safety.trim().length > 0 && (
                <div className="p-5 rounded-2xl border-2"
                     style={{ background: "rgba(216, 166, 166, 0.12)", borderColor: "rgba(216, 166, 166, 0.4)" }}
                     data-testid="sos-safety">
                  <div className="flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-[#C46666] shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase text-[#C46666] mb-1">Important</p>
                      <p className="text-[#1F2A24] leading-relaxed">{response.safety}</p>
                      <p className="text-xs text-[#7A6F66] mt-2">
                        Crisis lines (US): call or text <span className="font-medium">988</span> · UK: <span className="font-medium">116 123</span> · International: <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="text-[#E68AA1] underline">findahelpline.com</a>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setResponse(null); setMessage(""); }}
                        className="btn-ghost active:scale-95 transition" data-testid="sos-share-more">
                  Share more
                </button>
                <button onClick={onClose}
                        className="btn-primary inline-flex items-center gap-2 active:scale-95 transition"
                        data-testid="sos-close-after">
                  I'm a little steadier <ArrowRight className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, accent, children }) => (
  <div>
    <p className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: accent }}>{title}</p>
    <div className="pl-1">{children}</div>
  </div>
);
