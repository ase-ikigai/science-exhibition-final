import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { X, ArrowRight, Mail, Lock, User } from "lucide-react";

const BREATHE_PHASES = [
  { label: "Breathe in", duration: 4000 },
  { label: "Hold", duration: 2000 },
  { label: "Breathe out", duration: 6000 },
  { label: "Rest", duration: 2000 },
];

const MeditationOverlay = ({ elapsed }) => {
  const [phaseIdx, setPhaseIdx] = useState(0);
  useEffect(() => {
    const total = BREATHE_PHASES[phaseIdx].duration;
    const t = setTimeout(() => setPhaseIdx(i => (i + 1) % BREATHE_PHASES.length), total);
    return () => clearTimeout(t);
  }, [phaseIdx]);
  const secs = Math.max(0, 50 - elapsed);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl"
         style={{ background: "rgba(250,247,241,0.97)", backdropFilter: "none" }}>
      <p className="text-[10px] tracking-[0.4em] uppercase text-[#B89668] mb-6">IKIGAI is waking up · ~{secs}s</p>
      <div className="relative flex items-center justify-center mb-6" style={{ width: 120, height: 120 }}>
        <div className="breathe-ring absolute rounded-full"
             style={{ width: 120, height: 120, border: "1.5px solid rgba(230,138,161,0.4)" }}/>
        <div className="breathe-circle absolute rounded-full"
             style={{ width: 80, height: 80,
               background: "radial-gradient(circle, rgba(245,210,221,0.9) 0%, rgba(230,138,161,0.6) 60%, rgba(230,138,161,0.2) 100%)" }}/>
        <div className="absolute rounded-full"
             style={{ width: 28, height: 28, background: "rgba(230,138,161,0.45)" }}/>
      </div>
      <p className="font-serif text-2xl text-[#1F2A24] mb-1">{BREATHE_PHASES[phaseIdx].label}</p>
      <p className="text-[10px] tracking-[0.3em] uppercase text-[#7A6F66] mt-1">
        {phaseIdx === 0 ? "4 seconds" : phaseIdx === 1 ? "2 seconds" : phaseIdx === 2 ? "6 seconds" : "rest"}
      </p>
      <p className="text-xs text-[#7A6F66] mt-5 max-w-[200px] text-center leading-relaxed">
        First load wakes the server from sleep. This is a one-time wait.
      </p>
    </div>
  );
};

export const AuthModal = ({ mode, onClose, onSuccess }) => {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState(mode || "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teen");
  const [loading, setLoading] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [showMeditation, setShowMeditation] = useState(false);
  const loadingStartRef = useRef(null);
  const loadingTimerRef = useRef(null);
  const focusRef = useRef(null);

  // Focus only on mount + when tab switches — NOT on every onClose identity change
  useEffect(() => {
    const id = setTimeout(() => focusRef.current?.focus?.(), 80);
    return () => clearTimeout(id);
  }, [tab]);

  // Escape to close — stable handler
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLoadingTimer = () => {
    loadingStartRef.current = Date.now();
    setLoadingElapsed(0);
    setShowMeditation(false);
    loadingTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - loadingStartRef.current) / 1000);
      setLoadingElapsed(elapsed);
      if (elapsed >= 5) setShowMeditation(true);
    }, 1000);
  };

  const stopLoadingTimer = () => {
    clearInterval(loadingTimerRef.current);
    setShowMeditation(false);
    setLoadingElapsed(0);
  };

  const submit = useCallback(async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    setLoading(true);
    startLoadingTimer();
    try {
      let user;
      if (tab === "signup") {
        if (!name.trim()) { toast.error("Tell us your name"); setLoading(false); stopLoadingTimer(); return; }
        user = await signup({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
      } else {
        user = await login({ email: email.trim().toLowerCase(), password });
      }
      stopLoadingTimer();
      onSuccess?.(user);
    } catch (err) {
      stopLoadingTimer();
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? (detail[0]?.msg?.replace(/^value error,\s*/i, "") || "Please double-check your inputs")
          : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, name, email, password, role, loading, login, signup, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
         data-testid="auth-modal" onClick={onClose}>
      {/* Backdrop — solid (no blur — was causing typing lag on weaker GPUs) */}
      <div className="absolute inset-0" style={{ background: "rgba(31, 42, 36, 0.55)" }}/>

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-[#FAF7F1] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-fade-up"
           onClick={e => e.stopPropagation()}>
        {showMeditation && <MeditationOverlay elapsed={loadingElapsed}/>}
        {/* Soft gradient top */}
        <div className="absolute top-0 inset-x-0 h-32 pointer-events-none"
             style={{ background: "linear-gradient(180deg, rgba(245,210,221,0.45) 0%, rgba(250,247,241,0) 100%)" }}/>

        <button onClick={onClose} type="button" data-testid="auth-close"
                className="absolute top-4 right-4 z-10 p-2 rounded-full text-[#1F2A24]/60 hover:text-[#1F2A24] hover:bg-[#1F2A24]/5 transition active:scale-95">
          <X className="w-4 h-4"/>
        </button>

        <div className="relative p-7 sm:p-9">
          <p className="text-[10px] tracking-[0.45em] uppercase text-[#B89668] mb-2">
            {tab === "signup" ? "Plant your sanctuary" : "Welcome back"}
          </p>
          <h2 className="font-serif text-3xl text-[#1F2A24] mb-1" data-testid="auth-title">
            {tab === "signup" ? "Begin your journey" : "Step back in"}
          </h2>
          <p className="text-sm text-[#7A6F66] mb-6">
            {tab === "signup" ? "Just a name, an email, a password — that's all." : "We've kept your seat warm."}
          </p>

          {/* Tab toggle pill */}
          <div className="flex p-1 rounded-full bg-[#1F2A24]/6 mb-6 text-xs tracking-[0.2em] uppercase" data-testid="auth-tabs">
            <button type="button" onClick={() => setTab("signup")} data-testid="tab-signup"
                    className={`flex-1 py-2 rounded-full transition ${tab === "signup" ? "bg-white text-[#1F2A24] shadow-sm" : "text-[#7A6F66]"}`}>
              Sign up
            </button>
            <button type="button" onClick={() => setTab("signin")} data-testid="tab-signin"
                    className={`flex-1 py-2 rounded-full transition ${tab === "signin" ? "bg-white text-[#1F2A24] shadow-sm" : "text-[#7A6F66]"}`}>
              Sign in
            </button>
          </div>

          {/* Role pills (signup only) */}
          {tab === "signup" && (
            <div className="flex p-1 rounded-full bg-[#FAEDE2] mb-5 text-xs tracking-[0.18em] uppercase" data-testid="role-tabs">
              <button type="button" onClick={() => setRole("teen")} data-testid="role-teen"
                      className={`flex-1 py-2 rounded-full transition ${role === "teen" ? "bg-[#E68AA1] text-white shadow-sm" : "text-[#7A6F66]"}`}>
                I'm a teen
              </button>
              <button type="button" onClick={() => setRole("parent")} data-testid="role-parent"
                      className={`flex-1 py-2 rounded-full transition ${role === "parent" ? "bg-[#1F2A24] text-white shadow-sm" : "text-[#7A6F66]"}`}>
                I'm a parent
              </button>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3" data-testid="auth-form">
            {tab === "signup" && (
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6F66] z-10 pointer-events-none"/>
                <input ref={focusRef} value={name} onChange={e => setName(e.target.value)}
                       placeholder="Your name" data-testid="signup-name"
                       className="input-zen" style={{ paddingLeft: "2.6rem" }} autoComplete="given-name"/>
              </div>
            )}
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6F66] z-10 pointer-events-none"/>
              <input ref={tab === "signin" ? focusRef : null} type="email" value={email}
                     onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
                     data-testid="auth-email" className="input-zen" style={{ paddingLeft: "2.6rem" }}
                     autoComplete="email" required/>
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6F66] z-10 pointer-events-none"/>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     placeholder={tab === "signup" ? "Create a password (6+ chars)" : "Your password"}
                     data-testid="auth-password" className="input-zen" style={{ paddingLeft: "2.6rem" }}
                     autoComplete={tab === "signup" ? "new-password" : "current-password"}
                     minLength={6} required/>
            </div>

            <button type="submit" disabled={loading}
                    className="w-full mt-2 py-3.5 rounded-full text-sm tracking-[0.2em] uppercase bg-[#1F2A24] text-[#FAF7F1] hover:bg-[#2D3F36] inline-flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-60"
                    data-testid="auth-submit">
              {loading ? (tab === "signup" ? "Planting…" : "Opening…") : (
                <>
                  {tab === "signup" ? "Begin" : "Sign in"}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2}/>
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center tracking-[0.18em] uppercase text-[#7A6F66] mt-6">
            {tab === "signup" ? "By beginning, you agree to be kind to yourself." : "We'll never share your reflections."}
          </p>
        </div>
      </div>
    </div>
  );
};
