import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import MoodDump from "./pages/MoodDump";
import Journal from "./pages/Journal";
import Coach from "./pages/Coach";
import LifeMap from "./pages/LifeMap";
import ProblemSolver from "./pages/ProblemSolver";
import Identity from "./pages/Identity";
import Missions from "./pages/Missions";
import Insights from "./pages/Insights";
import Focus from "./pages/Focus";
import Wellness from "./pages/Wellness";
import Family from "./pages/Family";
import Garden from "./pages/Garden";
import Plan from "./pages/Plan";
import KeepGoing from "./pages/KeepGoing";
import ParentDashboard from "./pages/ParentDashboard";

const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--ikigai-bg)" }}>
    <div className="text-center animate-fade-up">
      <div className="flex items-center justify-center gap-2 mb-3">
        <svg className="w-5 h-5 text-[#E68AA1] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11z" />
        </svg>
        <span className="font-serif text-lg tracking-[0.4em] text-[#1F2A24]">IKIGAI</span>
      </div>
      <p className="text-[10px] tracking-[0.45em] uppercase text-[#7A6F66]">opening your sanctuary…</p>
    </div>
  </div>
);

const RequireAuth = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/" replace/>;
  if (role && user.role !== role) return <Navigate to={user.role === "parent" ? "/parent" : "/home"} replace/>;
  return children;
};

const TeenGate = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/" replace/>;
  if (user.role !== "teen") return <Navigate to="/parent" replace/>;
  if (!user.onboarded) return <Navigate to="/onboarding" replace/>;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/onboarding" element={
        <RequireAuth role="teen"><Onboarding/></RequireAuth>
      }/>
      <Route path="/home" element={<TeenGate><Home/></TeenGate>}/>
      <Route path="/life-map" element={<TeenGate><LifeMap/></TeenGate>}/>
      <Route path="/mood" element={<TeenGate><MoodDump/></TeenGate>}/>
      <Route path="/journal" element={<TeenGate><Journal/></TeenGate>}/>
      <Route path="/solve" element={<TeenGate><ProblemSolver/></TeenGate>}/>
      <Route path="/identity" element={<TeenGate><Identity/></TeenGate>}/>
      <Route path="/missions" element={<TeenGate><Missions/></TeenGate>}/>
      <Route path="/insights" element={<TeenGate><Insights/></TeenGate>}/>
      <Route path="/focus" element={<TeenGate><Focus/></TeenGate>}/>
      <Route path="/wellness" element={<TeenGate><Wellness/></TeenGate>}/>
      <Route path="/coach" element={<TeenGate><Coach/></TeenGate>}/>
      <Route path="/garden" element={<TeenGate><Garden/></TeenGate>}/>
      <Route path="/plan" element={<TeenGate><Plan/></TeenGate>}/>
      <Route path="/keep-going" element={<TeenGate><KeepGoing/></TeenGate>}/>
      <Route path="/family" element={<TeenGate><Family/></TeenGate>}/>
      <Route path="/parent" element={
        <RequireAuth role="parent"><ParentDashboard/></RequireAuth>
      }/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
        <Toaster position="top-center" theme="light"
                 toastOptions={{
                   style: { background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
                            border: "1px solid rgba(230,138,161,0.2)", color: "#2D1B22",
                            borderRadius: "999px", fontFamily: "Outfit, sans-serif" }
                 }}/>
      </BrowserRouter>
    </AuthProvider>
  );
}
