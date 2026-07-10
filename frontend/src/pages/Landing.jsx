import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ArrowRight, Heart, Leaf, CircleDot, Flower2, Brain, AlertCircle, BookHeart, Sparkles } from "lucide-react";
import { SakuraTree } from "../components/SakuraTree";
import { AuthModal } from "./AuthModal";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [auth, setAuth] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef(null);

  const showLandingPreview = () => {
    setShowPreview(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // Subtle scroll progress (lightweight — no library)
  const [scrolled, setScrolled] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrolled(Math.min(1, window.scrollY / 600));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-redirect logged-in users — they shouldn't see Landing again
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ikigai-bg)" }} data-testid="landing-loading">
        <div className="text-center animate-fade-up">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flower2 className="w-5 h-5 text-[#E68AA1]" strokeWidth={1.5}/>
            <span className="font-serif text-lg tracking-[0.4em] text-[#1F2A24]">IKIGAI</span>
          </div>
          <p className="text-[10px] tracking-[0.45em] uppercase text-[#7A6F66]">opening your sanctuary…</p>
        </div>
      </div>
    );
  }
  if (user) {
    if (user.role === "parent") return <Navigate to="/parent" replace/>;
    if (!user.onboarded) return <Navigate to="/onboarding" replace/>;
    return <Navigate to="/home" replace/>;
  }

  const onAuthSuccess = (u) => {
    if (u.role === "parent") navigate("/parent");
    else if (!u.onboarded) navigate("/onboarding");
    else navigate("/home");
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "var(--ikigai-bg)" }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 px-6 sm:px-10 py-5 flex items-center justify-between"
              style={{
                background: scrolled > 0.05 ? "rgba(250,247,241,0.78)" : "transparent",
                backdropFilter: scrolled > 0.05 ? "blur(18px)" : "none",
                borderBottom: scrolled > 0.05 ? "1px solid rgba(31,42,36,0.06)" : "none",
                transition: "background 0.4s, backdrop-filter 0.4s, border 0.4s",
              }}>
        <div className="flex items-center gap-2">
          <Flower2 className="w-4 h-4 text-[#E68AA1]" strokeWidth={1.5}/>
          <span className="font-serif text-lg tracking-[0.4em] text-[#1F2A24]" data-testid="brand-mark">IKIGAI</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <button onClick={() => setAuth({ mode: "signin" })}
                  className="text-xs tracking-[0.25em] uppercase text-[#1F2A24]/70 hover:text-[#1F2A24] transition active:scale-95"
                  data-testid="signin-btn">
            Sign in
          </button>
          <button onClick={() => setAuth({ mode: "signup" })}
                  className="px-5 py-2.5 rounded-full text-xs tracking-[0.2em] uppercase bg-[#1F2A24] text-[#FAF7F1] hover:bg-[#2D3F36] transition active:scale-95"
                  data-testid="signup-btn-top">
            Begin
          </button>
        </div>
      </header>

      {/* Kanji watermark */}
      <div className="hidden md:block absolute top-32 left-10 font-serif text-2xl tracking-[0.4em] text-[#1F2A24]/15 z-10 select-none" data-testid="kanji-mark">
        生<br/>き<br/>甲<br/>斐
      </div>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col lg:flex-row items-center px-6 sm:px-12 lg:px-24 pt-24">
        {/* Left: tagline */}
        <div className="lg:w-1/2 lg:pr-12 z-10 max-w-xl animate-fade-up">
          <p className="text-base font-serif italic tracking-[0.18em] text-[#B89668] mb-6" style={{ letterSpacing: "0.08em" }}>
            love yourself. grow. bloom. find your ikigai.
          </p>
          <h1 className="font-serif text-[clamp(2.6rem,7vw,5.4rem)] leading-[1.04] text-[#1F2A24] tracking-tight mb-7"
              data-testid="hero-headline">
            Discover<br/>
            <span className="italic text-[#E68AA1]">who you're</span><br/>
            becoming.
          </h1>
          <p className="text-lg text-[#1F2A24]/75 leading-relaxed mb-10 max-w-md font-serif">
            A quiet place to feel, untangle, and grow — guided by a tree that blooms with you.
            No streaks. No noise. Just you.
          </p>
          <div className="flex items-center gap-5 flex-wrap">
            <button onClick={() => setAuth({ mode: "signup" })}
                    className="group px-7 py-3.5 rounded-full text-sm tracking-[0.18em] uppercase bg-[#1F2A24] text-[#FAF7F1] hover:bg-[#2D3F36] inline-flex items-center gap-2.5 transition active:scale-95 shadow-lg shadow-[#1F2A24]/20"
                    data-testid="signup-btn">
              Begin your journey
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" strokeWidth={2}/>
            </button>
            <button onClick={showLandingPreview}
                    className="px-5 py-3 rounded-full text-sm tracking-[0.12em] uppercase bg-white/80 text-[#1F2A24] hover:bg-white border border-[#1F2A24]/10 transition active:scale-95"
                    data-testid="landing-preview-toggle">
              Preview
            </button>
            <button onClick={() => setAuth({ mode: "signin" })}
                    className="text-xs tracking-[0.25em] uppercase text-[#7A6F66] hover:text-[#1F2A24] transition"
                    data-testid="signin-link">
              Already a traveller →
            </button>
          </div>
        </div>

        {/* Right: cinematic tree */}
        <div className="lg:w-1/2 relative h-[60vh] lg:h-[80vh] w-full mt-10 lg:mt-0 overflow-hidden rounded-[2rem] shadow-[0_40px_120px_rgba(31,42,36,0.08)] bg-[#fbf3ee]">
          {/* Soft radial backdrop */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: "radial-gradient(ellipse at 60% 60%, rgba(245,210,221,0.35) 0%, rgba(250,247,241,0.0) 60%)" }}/>
          {/* Orbit rings (echoing reference's circular composition, but soft) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <circle cx="200" cy="220" r="170" fill="none" stroke="#1F2A24" strokeWidth="0.5" strokeDasharray="2,4"/>
            <circle cx="200" cy="220" r="135" fill="none" stroke="#1F2A24" strokeWidth="0.4" strokeDasharray="1,5"/>
            <circle cx="200" cy="220" r="100" fill="none" stroke="#1F2A24" strokeWidth="0.4" strokeDasharray="1,7"/>
          </svg>
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 p-6">
            <img
              src="/sakura_tree.png"
              alt="Sakura tree"
              className="w-full h-full object-contain object-bottom select-none"
              style={{
                filter: "drop-shadow(0 30px 40px rgba(230,138,161,0.37)) saturate(1.1) brightness(1.0)",
                WebkitMaskImage: "radial-gradient(ellipse 75% 85% at 50% 50%, black 60%, transparent 100%)",
                maskImage: "radial-gradient(ellipse 75% 85% at 50% 50%, black 60%, transparent 100%)",
              }}
            />
          </div>
          {/* Tiny annotation in the orbit */}
          <div className="absolute top-8 right-6 text-[10px] tracking-[0.3em] uppercase text-[#1F2A24]/50">
            <span className="font-serif italic normal-case tracking-normal text-[11px]">stage seven · radiant sakura</span>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="px-6 sm:px-12 lg:px-24 py-24 relative">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] tracking-[0.45em] uppercase text-[#B89668] mb-3 text-center">Why IKIGAI</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-center text-[#1F2A24] mb-6 max-w-3xl mx-auto leading-tight">
            <span className="italic text-[#E68AA1]">Built</span> for the way you actually feel.
          </h2>
          <p className="text-base sm:text-lg text-[#7A6F66] text-center max-w-3xl mx-auto leading-relaxed mb-12">
            Life isn’t one problem. Some days you need clarity. Some days you need encouragement. Some days you simply need to know you’re growing. IKIGAI brings everything together into one calm space.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Pillar icon={Heart} title="Understand Yourself"
                    desc="Speak, write, or simply reflect. IKIGAI remembers your thoughts, emotions and patterns so every conversation builds a deeper understanding of you."/>
            <Pillar icon={Leaf} title="Grow, Don’t Grind"
                    desc="Forget streaks and guilt. Every small habit quietly nurtures your tree, showing progress you can actually see instead of numbers you simply count."/>
            <Pillar icon={CircleDot} title="Everything Connected"
                    desc="Journal, habits, mood, AI guidance and personal insights all work together as one experience instead of feeling like separate apps."/>
          </div>
        </div>
      </section>

      {/* COMBINED PREVIEW: Home / Not-Okay & Negative Thoughts / Parents */}
      {showPreview && (
        <section ref={previewRef} className="px-6 sm:px-12 lg:px-24 py-20 relative">
          <div className="max-w-6xl mx-auto">
            <p className="text-[10px] tracking-[0.45em] uppercase text-[#B89668] mb-3 text-center">Preview</p>
            <h2 className="font-serif text-3xl text-center text-[#1F2A24] mb-8">A quick look: Home · Mood · Parents</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ border: '2px dashed rgba(230,138,161,0.25)', padding: 10 }} data-testid="landing-preview">
              <HomePreview />
              <MoodPreview />
              <ParentsPreview />
            </div>
          </div>
        </section>
      )}

      {/* QUOTE */}
      <section className="px-6 sm:px-12 lg:px-24 pt-12 pb-32 text-center">
        <p className="font-serif italic text-2xl sm:text-3xl text-[#1F2A24] max-w-3xl mx-auto leading-snug">
          <span className="text-[#E68AA1]">love yourself.</span> <span className="text-[#E68AA1]">bloom.</span> <span className="text-[#E68AA1]">find your ikigai.</span>
        </p>
      </section>

      {/* FOOTER CTA */}
      <section className="relative px-6 sm:px-12 py-24 text-center"
               style={{ background: "linear-gradient(180deg, rgba(245,210,221,0.18), rgba(250,247,241,0))" }}>
        <h3 className="font-serif text-3xl sm:text-4xl text-[#1F2A24] mb-6">Ready to plant the first petal?</h3>
        <button onClick={() => setAuth({ mode: "signup" })}
                className="px-7 py-3.5 rounded-full text-sm tracking-[0.18em] uppercase bg-[#E68AA1] text-white hover:bg-[#d6779b] inline-flex items-center gap-2.5 transition active:scale-95 shadow-lg shadow-[#E68AA1]/30"
                data-testid="signup-btn-bottom">
          Begin
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2}/>
        </button>
        <p className="text-xs tracking-[0.25em] uppercase text-[#7A6F66] mt-10">Ikigai · 生き甲斐 · The reason for being</p>
      </section>

      {auth && <AuthModal mode={auth.mode} onClose={() => setAuth(null)} onSuccess={onAuthSuccess}/>}
    </div>
  );
}

// --- PREVIEW COMPONENTS (lightweight, static for landing preview) ---
function HomePreview() {
  // simple static preview that mirrors key Home parts
  return (
    <div className="zen-card p-6">
      <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mb-2">Home (preview)</p>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#7A6F66]">A new petal</p>
          <h4 className="font-serif text-2xl text-[#1F2A24]">Good morning, Friend</h4>
          <p className="text-sm text-[#7A6F66] mt-2">“You’re doing better than you think.”</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/60 text-center">
              <div className="font-serif text-xl text-[#1F2A24]">6/10</div>
              <div className="text-[10px] text-[#7A6F66]">Mood</div>
            </div>
            <div className="p-3 rounded-lg bg-white/60 text-center">
              <div className="font-serif text-xl text-[#E68AA1]">+2</div>
              <div className="text-[10px] text-[#7A6F66]">Blossoms</div>
            </div>
          </div>
        </div>
        <div className="w-28 h-28">
          <SakuraTree stage="seedling" blossoms={4} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

function MoodPreview() {
  // show both Negative Thoughts and I'm Not Okay previews
  return (
    <div className="space-y-4">
      <div className="zen-card p-5">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-2">Negative Thoughts</p>
        <p className="text-sm italic text-[#1F2A24] mb-3">“I always mess up”</p>
        <div className="text-xs text-[#7A6F66]">Reframe suggestion</div>
        <div className="mt-2 p-3 rounded-lg bg-[#F5F5F5]">You are learning — one step at a time.</div>
        <div className="mt-4 text-right">
          <button className="btn-primary text-sm" disabled>Reframe</button>
        </div>
      </div>

      <div className="zen-card p-5">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#7A6F66] mb-2">I'm Not Okay</p>
        <p className="font-serif text-lg text-[#1F2A24] italic">“I'm overwhelmed with school.”</p>
        <p className="text-sm text-[#7A6F66] mt-3">Validation and gentle steps would appear here when you share.</p>
        <div className="mt-4 text-right">
          <button className="btn-primary text-sm" disabled>Share</button>
        </div>
      </div>
    </div>
  );
}

function ParentsPreview() {
  return (
    <div className="zen-card p-6">
      <p className="text-[10px] tracking-[0.25em] uppercase text-[#8A7E82] mb-2">Parent View</p>
      <h3 className="font-serif text-2xl mb-2">Teen's Journey</h3>
      <p className="text-sm text-[#2D1B22]/70 mb-4">A privacy-first overview: trends and small wins.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/60 text-center">
          <div className="font-serif text-xl text-[#1F2A24]">7</div>
          <div className="text-[10px] text-[#8A7E82]">Check-ins</div>
        </div>
        <div className="p-3 rounded-lg bg-white/60 text-center">
          <div className="font-serif text-xl text-[#E68AA1]">+2</div>
          <div className="text-[10px] text-[#8A7E82]">Blossoms</div>
        </div>
      </div>
      <div className="mt-4 text-right">
        <button className="btn-primary text-sm">Open parent view</button>
      </div>
    </div>
  );
}

const Pillar = ({ icon: Icon, title, desc }) => (
  <div className="zen-card p-8 hover:-translate-y-1 transition-transform duration-300" style={{ boxShadow: "0 24px 48px rgba(31,42,36,0.08)" }}>
    <span className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
          style={{ background: "rgba(230,138,161,0.15)", color: "#1F2A24" }}>
      <Icon className="w-5 h-5" strokeWidth={1.5}/>
    </span>
    <h3 className="font-serif text-2xl text-[#1F2A24] mb-3">{title}</h3>
    <p className="text-[#1F2A24]/75 leading-relaxed">{desc}</p>
  </div>
);
