import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import client from "../lib/api";
import { Copy, Check, Users } from "lucide-react";
import { toast } from "sonner";

export default function Family() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    client.get("/family/code").then(r => setCode(r.data.code)).catch(() => {});
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto" data-testid="family-page">
        <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-2 flex items-center gap-2">
          <Users className="w-3.5 h-3.5"/> Family
        </p>
        <h1 className="font-serif text-5xl mb-3">Your Family Code</h1>
        <p className="text-[#2D1B22]/70 mb-8 leading-relaxed">
          Share this code with a parent so they can support your journey — without ever reading your private thoughts.
        </p>

        <div className="zen-card p-10 text-center" data-testid="family-code-card">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8A7E82] mb-4">Family Code</p>
          <p className="font-serif text-6xl tracking-[0.2em] text-[#E68AA1] mb-6" data-testid="family-code-value">{code || "······"}</p>
          <button onClick={copy} className="btn-ghost inline-flex items-center gap-2" data-testid="copy-family-code">
            {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>

        <div className="zen-card p-8 mt-6" data-testid="privacy-card">
          <h3 className="font-serif text-2xl mb-4">What your parent will see</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#E68AA1]">Visible</p>
              <p>· Sleep consistency</p>
              <p>· Routine completion</p>
              <p>· Mood trends (averages)</p>
              <p>· Wellness score</p>
              <p>· Weekly summary</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#B5B5DC]">Private to you</p>
              <p>· Journal entries</p>
              <p>· Mood dump content</p>
              <p>· AI Coach chats</p>
              <p>· Personal reflections</p>
              <p>· Your exact words</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
