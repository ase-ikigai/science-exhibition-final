import React, { useEffect, useRef, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Send, Sparkles } from "lucide-react";

export default function Coach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    client.get("/coach/history").then(r => setMessages(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: text, id: `u-${Date.now()}` }]);
    setStreaming(true);
    setMessages(m => [...m, { role: "assistant", content: "", id: "stream", streaming: true }]);
    try {
      const { data } = await client.post("/coach/chat", { message: text });
      const reply = data.response || "I'm here with you.";
      setMessages(m => m.map(msg =>
        msg.id === "stream"
          ? { ...msg, content: reply, id: `a-${Date.now()}`, streaming: false }
          : msg
      ));
    } catch {
      setMessages(m => m.map(msg =>
        msg.id === "stream"
          ? { ...msg, content: "I'm here, but the connection wavered. Try again?", id: `a-${Date.now()}`, streaming: false }
          : msg
      ));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col" data-testid="coach-page">
        <div className="mb-5">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5"/> AI Coach
          </p>
          <h1 className="font-serif text-4xl">A wise, calm friend</h1>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto zen-card p-6 space-y-4 mb-4" data-testid="coach-messages">
          {messages.length === 0 && (
            <div className="text-center py-12 text-[#8A7E82]">
              <p className="font-serif text-2xl text-[#2D1B22]/70 mb-2">Hi, I'm here.</p>
              <p className="text-sm">Tell me what's on your heart, big or small.</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-5 py-3 rounded-3xl ${
                m.role === "user"
                  ? "bg-[#E68AA1] text-white"
                  : "bg-white/70 backdrop-blur text-[#2D1B22] border border-white/60"
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {m.content}{m.streaming && <span className="inline-block w-2 h-4 bg-[#E68AA1] ml-1 animate-pulse"/>}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <input className="input-zen flex-1" placeholder="What's on your mind?"
                 value={input} onChange={e => setInput(e.target.value)}
                 onKeyDown={e => { if (e.key === "Enter") send(); }}
                 data-testid="coach-input"/>
          <button onClick={send} disabled={streaming || !input.trim()} className="btn-primary inline-flex items-center gap-2" data-testid="coach-send">
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </Layout>
  );
}
