import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, BookHeart, PenLine, MessageCircleHeart, LogOut, Map,
  Compass, Flower2, BarChart3, User, Sparkles, Heart, AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SOSModal } from "./SOSModal";

const teenSecondary = [
  { to: "/home", label: "Home", icon: Home, tid: "nav-home" },
  { to: "/garden", label: "Garden", icon: Flower2, tid: "nav-garden" },
  { to: "/plan", label: "Plan", icon: Map, tid: "nav-plan", center: true },
  { to: "/insights", label: "Insights", icon: BarChart3, tid: "nav-insights-bottom" },
  { to: "/family", label: "Profile", icon: User, tid: "nav-family" },
];

const teenRail = [
  { to: "/mood", label: "Mood", icon: BookHeart, tid: "nav-mood" },
  { to: "/solve", label: "Solve", icon: Compass, tid: "nav-solve" },
  { to: "/journal", label: "Journal", icon: PenLine, tid: "nav-journal" },
  { to: "/missions", label: "Missions", icon: Sparkles, tid: "nav-missions" },
  { to: "/keep-going", label: "Keep going", icon: Heart, tid: "nav-keep-going" },
];

const parentNav = [
  { to: "/parent", label: "Overview", icon: Home, tid: "nav-parent", center: true },
];

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [sosOpen, setSosOpen] = useState(false);
  const isParent = user?.role === "parent";
  const items = isParent ? parentNav : teenSecondary;

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen relative pb-32">
      {/* Floating petals background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {Array.from({ length: 10 }).map((_, i) => {
          const left = (i * 73) % 100;
          const delay = (i * 0.9) % 14;
          const dur = 16 + (i % 4) * 3;
          return (
            <span key={i} className="petal" style={{
              left: `${left}%`, top: `-5%`,
              animation: `${i % 2 ? 'petal-fall-2' : 'petal-fall'} ${dur}s linear ${delay}s infinite`,
            }}/>
          );
        })}
      </div>

      {/* Top minimal bar */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(248,245,239,0.75)", backdropFilter: "blur(18px)" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link to={isParent ? "/parent" : "/home"} className="flex items-center gap-2" data-testid="nav-logo">
            <Flower2 className="w-5 h-5 text-[#E68AA1]" strokeWidth={1.5}/>
            <span className="font-serif text-xl tracking-[0.3em] text-[#1F2A24]">IKIGAI</span>
          </Link>

          {/* Secondary rail (mood/solve/coach/journal) for teens */}
          {!isParent && (
            <nav className="hidden md:flex items-center gap-1">
              {teenRail.map(({ to, label, icon: Icon, tid }) => {
                const active = loc.pathname === to;
                return (
                  <Link key={tid} to={to} data-testid={tid}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs tracking-[0.1em] uppercase transition-all ${
                          active ? 'bg-[#2D3F36] text-[#FAF7F1]' : 'text-[#1F2A24]/70 hover:bg-white/60'
                        }`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5}/>
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {/* "I'm not okay" — global safe button */}
            {!isParent && (
              <button onClick={() => setSosOpen(true)} data-testid="sos-button"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[10px] tracking-[0.18em] uppercase
                                 border border-[#E68AA1]/40 text-[#C46666] hover:bg-[#E68AA1]/10 transition active:scale-95">
                <AlertCircle className="w-3 h-3"/> Not okay
              </button>
            )}
            <span className="hidden sm:inline text-xs tracking-[0.15em] uppercase text-[#7A6F66]" data-testid="user-name">
              {user?.name}
            </span>
            <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white/60 transition" data-testid="logout-btn">
              <LogOut className="w-4 h-4 text-[#7A6F66]" strokeWidth={1.5}/>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        {children}
      </main>

      {/* Mobile-only floating SOS pill */}
      {!isParent && (
        <button onClick={() => setSosOpen(true)} data-testid="sos-button-mobile"
                className="sm:hidden fixed bottom-28 right-5 z-40 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs tracking-[0.18em] uppercase
                           bg-white/95 backdrop-blur border border-[#E68AA1]/40 text-[#C46666] shadow-lg active:scale-95 transition">
          <AlertCircle className="w-3.5 h-3.5"/> Not okay
        </button>
      )}

      {/* Floating bottom nav (mobile + decorative on desktop) */}
      <nav className="bottom-nav" data-testid="bottom-nav">
        {items.map(({ to, label, icon: Icon, tid, center }) => {
          const active = loc.pathname === to;
          if (center) {
            return (
              <Link key={tid} to={to} data-testid={tid}
                    className="flex flex-col items-center -mt-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  active ? 'shadow-lg' : ''
                }`} style={{
                  background: active ? "linear-gradient(135deg, #E68AA1, #D8A6A6)" : "linear-gradient(135deg, #F5D2DD, #FAF7F1)",
                  border: "2px solid rgba(31,42,36,0.12)",
                  boxShadow: active ? "0 8px 24px rgba(230,138,161,0.4)" : "0 4px 14px rgba(31,42,36,0.15)",
                }}>
                  <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-[#E68AA1]'}`} strokeWidth={1.5}/>
                </div>
                <span className="text-[9px] tracking-[0.2em] uppercase text-[#7A6F66] mt-1">{label}</span>
              </Link>
            );
          }
          return (
            <Link key={tid} to={to} data-testid={tid}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-full transition-all ${
                    active ? 'text-[#1F2A24]' : 'text-[#7A6F66] hover:text-[#1F2A24]'
                  }`}>
              <Icon className="w-4 h-4" strokeWidth={1.5}/>
              <span className="text-[9px] tracking-[0.15em] uppercase">{label}</span>
            </Link>
          );
        })}
      </nav>

      {sosOpen && <SOSModal onClose={() => setSosOpen(false)}/>}
    </div>
  );
};
