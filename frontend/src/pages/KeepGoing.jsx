import React, { useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import {
  Heart, ArrowRight, Loader2, Sparkles, MessageCircle, Eye, Shield, Sunrise
} from "lucide-react";
import { toast } from "sonner";

export default function KeepGoing() {
  const [feeling, setFeeling] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true); setResponse(null);
    try {
      const { data } = await client.post("/keep-going", { message: feeling });
      setResponse(data.response);
    } catch { toast.error("Couldn't reach IKIGAI"); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto" data-testid="keep-going-page">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2 flex items-center gap-1.5">
          <Heart className="w-3 h-3"/> Keep Going
        </p>
        <h1 className="font-serif text-5xl text-[#1F2A24] mb-3 leading-tight">
          Wanting to quit is not <span className="italic text-[#E68AA1]">failing</span>.
        </h1>
        <p className="text-[#1F2A24]/75 leading-relaxed mb-8 max-w-xl">
          It just means you're tired. Slow down. IKIGAI will ask a few honest questions — not to push you,
          just to remember why you started.
        </p>

        {!response && (
          <div className="zen-card p-7 mb-6 animate-fade-up">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Optional · what are you feeling?</p>
            <textarea className="input-zen min-h-[120px] font-serif text-base leading-relaxed mb-4"
                      placeholder="I want to quit because…"
                      value={feeling} onChange={e => setFeeling(e.target.value)}
                      data-testid="keep-input"/>
            <button onClick={ask} disabled={loading}
                    className="btn-primary inline-flex items-center gap-2 active:scale-95 transition"
                    data-testid="keep-submit">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Sparkles className="w-3.5 h-3.5"/>}
              {loading ? "Listening…" : "Ask IKIGAI"}
            </button>
          </div>
        )}

        {loading && (
          <div className="zen-card p-7 animate-pulse" data-testid="keep-loading">
            <div className="h-3 w-2/3 bg-[#1F2A24]/8 rounded-full mb-3"/>
            <div className="h-3 w-1/2 bg-[#1F2A24]/8 rounded-full mb-3"/>
            <div className="h-3 w-3/4 bg-[#1F2A24]/8 rounded-full"/>
          </div>
        )}

        {response && (
          <div className="space-y-5 animate-fade-up" data-testid="keep-response">
            {response.opening && (
              <div className="zen-card p-7"
                   style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.32), rgba(255,247,233,0.5))" }}>
                <p className="font-serif text-xl text-[#1F2A24] italic leading-relaxed">"{response.opening}"</p>
              </div>
            )}

            {response.questions && response.questions.length > 0 && (
              <Section icon={MessageCircle} accent="#E68AA1" label="Sit with these questions">
                <ol className="space-y-4">
                  {response.questions.map((q, i) => (
                    <li key={i} className="flex gap-4 items-start" data-testid={`keep-question-${i}`}>
                      <span className="font-serif text-3xl text-[#E68AA1] shrink-0 leading-none">{i + 1}.</span>
                      <p className="font-serif text-lg text-[#1F2A24] leading-snug pt-1">{q}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {response.why_started && (
              <Section icon={Sunrise} accent="#B89668" label="Why you started">
                <p className="font-serif text-lg text-[#1F2A24]/85 leading-relaxed">{response.why_started}</p>
              </Section>
            )}

            {response.contrast && (
              <Section icon={Eye} accent="#7AA37A" label="Old self · new self">
                <p className="text-[#1F2A24]/85 leading-relaxed">{response.contrast}</p>
              </Section>
            )}

            {response.one_small_step && (
              <div className="zen-card p-6"
                   style={{ background: "linear-gradient(135deg, rgba(245,210,221,0.35), rgba(255,247,233,0.6))",
                            border: "1px solid rgba(230,138,161,0.25)" }}>
                <p className="text-[10px] tracking-[0.25em] uppercase text-[#B89668] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3"/> One small step
                </p>
                <p className="font-serif text-xl text-[#1F2A24] leading-snug">{response.one_small_step}</p>
              </div>
            )}

            {response.if_still_quitting && (
              <div className="text-center pt-4">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2 flex items-center gap-1.5 justify-center">
                  <Shield className="w-3 h-3"/> A door, always open
                </p>
                <p className="font-serif italic text-[#1F2A24]/70 leading-relaxed max-w-xl mx-auto">
                  {response.if_still_quitting}
                </p>
              </div>
            )}

            <div className="text-center pt-2">
              <button onClick={() => { setResponse(null); setFeeling(""); }}
                      className="btn-ghost active:scale-95 transition" data-testid="keep-reset">
                Ask again
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

const Section = ({ icon: Icon, accent, label, children }) => (
  <div className="zen-card p-6">
    <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-3 flex items-center gap-1.5">
      <span className="w-5 h-5 rounded-full inline-flex items-center justify-center"
            style={{ background: `${accent}15`, color: accent }}>
        <Icon className="w-3 h-3" strokeWidth={1.75}/>
      </span>
      {label}
    </p>
    {children}
  </div>
);
