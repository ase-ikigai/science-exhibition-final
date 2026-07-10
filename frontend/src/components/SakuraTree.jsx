import React from "react";
import { BACKEND_URL } from "../lib/api";

/**
 * 7-stage Sakura. Each stage now has its own visual evolution rather than scaling
 * a single mature tree asset.
 */
export const STAGES = [
  "seed",      // 0 — small seed in the soil
  "sprout",    // 1 — tiny sprout
  "seedling",  // 5 — small sapling
  "growing",   // 12 — young tree with thin branches
  "mature",    // 25 — mature green tree
  "blooming",  // 50 — blossoms beginning
  "radiant",   // 100 — realistic cherry blossom tree
];

export const stageThresholds = {
  seed: 0, sprout: 1, seedling: 5, growing: 12, mature: 25, blooming: 50, radiant: 100,
};

const stageMeta = {
  seed:     { bloom: 0.0,  fireflies: 0, petals: 0,  label: "Seed",              poetic: "A seed in soft soil" },
  sprout:   { bloom: 0.05, fireflies: 1, petals: 0,  label: "Tiny Sprout",       poetic: "A tiny green sprout" },
  seedling: { bloom: 0.18, fireflies: 2, petals: 2,  label: "Small Sapling",     poetic: "A small sapling finding root" },
  growing:  { bloom: 0.4,  fireflies: 4, petals: 4,  label: "Young Tree",        poetic: "A young tree with thin branches" },
  mature:   { bloom: 0.65, fireflies: 7, petals: 6,  label: "Mature Green Tree", poetic: "Dense green leaves, steady trunk" },
  blooming: { bloom: 0.88, fireflies: 11, petals: 14, label: "Blossoms Beginning", poetic: "Pink petals begin to open" },
  radiant:  { bloom: 1.0,  fireflies: 16, petals: 20, label: "Radiant Sakura",    poetic: "Peak radiance in full bloom" },
  // back-compat with old keys
  young_tree:      { bloom: 0.4,  fireflies: 4, label: "Growing Tree", poetic: "Branches finding sky" },
  growing_sakura:  { bloom: 0.65, fireflies: 7, label: "Mature Tree", poetic: "Strong and steady" },
  blooming_sakura: { bloom: 0.88, fireflies: 11, label: "Blooming Sakura", poetic: "In full bloom" },
  ancient_sakura:  { bloom: 1.0,  fireflies: 16, label: "Radiant Sakura", poetic: "Peak radiance" },
};

const renderStageArt = (stage) => {
  const ground = (
    <>
      <ellipse className="tree-ground" cx="160" cy="362" rx="140" ry="24" />
      <ellipse className="tree-ground-shade" cx="160" cy="372" rx="110" ry="12" />
    </>
  );

  switch (stage) {
    case "seed":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <ellipse className="tree-seed" cx="160" cy="318" rx="8" ry="6" />
          <path d="M140 332 C146 326 154 320 170 324" fill="none" stroke="rgba(90,60,46,0.18)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "sprout":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <path d="M160 338 C158 324 156 310 156 300" className="tree-trunk-small" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M156 300 C146 286 136 276 142 266" className="tree-branch" strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse className="tree-leaf" cx="138" cy="262" rx="14" ry="10" />
          <ellipse className="tree-leaf" cx="168" cy="268" rx="14" ry="10" />
          <ellipse className="tree-leaf" cx="166" cy="288" rx="12" ry="8" />
        </svg>
      );

    case "seedling":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <path d="M160 344 C154 320 150 290 154 262" className="tree-trunk" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M154 278 C136 256 124 238 130 224" className="tree-branch" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M156 270 C172 248 186 230 180 216" className="tree-branch" strokeWidth="5" strokeLinecap="round" fill="none" />
          <ellipse className="tree-leaf" cx="128" cy="220" rx="18" ry="12" />
          <ellipse className="tree-leaf" cx="182" cy="214" rx="18" ry="12" />
          <ellipse className="tree-leaf" cx="158" cy="248" rx="20" ry="11" />
        </svg>
      );

    case "growing":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <path d="M160 354 C150 310 148 268 154 232" className="tree-trunk" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M154 262 C138 236 120 212 136 188" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M156 252 C170 236 186 216 196 194" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse className="tree-canopy" cx="160" cy="162" rx="94" ry="56" />
          <ellipse className="tree-canopy" cx="130" cy="148" rx="50" ry="28" />
          <ellipse className="tree-leaf" cx="185" cy="152" rx="24" ry="14" />
        </svg>
      );

    case "mature":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <path d="M160 356 C148 300 146 248 154 206" className="tree-trunk" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M154 236 C134 204 118 178 134 154" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M156 236 C176 204 196 178 206 156" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse className="tree-canopy-soft" cx="160" cy="146" rx="110" ry="72" />
          <ellipse className="tree-canopy-soft" cx="122" cy="136" rx="56" ry="34" />
          <ellipse className="tree-canopy-soft" cx="202" cy="128" rx="54" ry="32" />
          <circle className="tree-bloom" cx="132" cy="118" r="8" />
          <circle className="tree-bloom" cx="176" cy="130" r="7" />
          <circle className="tree-bloom" cx="158" cy="100" r="6" />
        </svg>
      );

    case "blooming":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <circle cx="160" cy="156" r="118" fill="rgba(255,228,236,0.18)" />
          <path d="M160 350 C146 298 142 236 152 192" className="tree-trunk" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M152 228 C134 194 114 168 132 144" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M158 238 C176 202 196 176 206 150" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse className="tree-canopy-soft" cx="160" cy="150" rx="118" ry="76" />
          <ellipse className="tree-canopy-soft" cx="118" cy="142" rx="64" ry="36" />
          <ellipse className="tree-canopy-soft" cx="204" cy="136" rx="60" ry="34" />
          <circle className="tree-bloom" cx="118" cy="122" r="10" />
          <circle className="tree-bloom" cx="182" cy="124" r="9" />
          <circle className="tree-bloom-deep" cx="152" cy="100" r="10" />
          <circle className="tree-bloom" cx="168" cy="150" r="8" />
          <circle className="tree-bloom" cx="138" cy="162" r="7" />
          <circle className="tree-bloom-deep" cx="160" cy="132" r="8" />
        </svg>
      );

    case "radiant":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <circle cx="160" cy="154" r="120" fill="rgba(255,234,241,0.16)" />
          <path d="M160 352 C150 292 146 232 154 192" className="tree-trunk" strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M154 224 C134 188 114 162 134 142" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M156 230 C176 188 198 166 212 146" className="tree-branch" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse className="tree-canopy-soft" cx="160" cy="150" rx="118" ry="78" />
          <ellipse className="tree-canopy-soft" cx="116" cy="140" rx="62" ry="38" />
          <ellipse className="tree-canopy-soft" cx="204" cy="134" rx="58" ry="36" />
          {Array.from({ length: 18 }).map((_, index) => {
            const angle = (index / 18) * Math.PI * 2;
            const radius = 55 + (index % 4) * 4;
            const cx = 160 + Math.cos(angle) * radius;
            const cy = 150 + Math.sin(angle) * radius * 0.7;
            return <circle key={index} className="tree-bloom" cx={cx} cy={cy} r={6 + (index % 3)} />;
          })}
          <circle className="tree-bloom-deep" cx="150" cy="118" r="11" />
          <circle className="tree-bloom-deep" cx="186" cy="132" r="9" />
          <circle className="tree-bloom-deep" cx="132" cy="154" r="8" />
        </svg>
      );

    default:
      return renderStageArt("sprout");
  }
};

export const SakuraTree = ({ stage = "sprout", blossoms = 0, resting = false, className = "", useLegacyImage = false }) => {
  const meta = stageMeta[stage] || stageMeta.sprout;
  const bloom = meta.bloom;
  const fireflyCount = meta.fireflies;
  const petalCount = meta.petals;
  const restingDim = resting ? 0.9 : 1.0;
  const treeFilter = `drop-shadow(0 30px 40px rgba(230,138,161,${0.12 + bloom * 0.25})) saturate(${0.9 + bloom * 0.2}) brightness(${restingDim})`;
  const treeUrl = `${BACKEND_URL}/api/tree/image`;
  const useLegacy = useLegacyImage || stage === "radiant";

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} data-testid="sakura-tree">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full"
             style={{
               background: `radial-gradient(ellipse at center, rgba(255,183,197,${0.2 + bloom * 0.35}) 0%, rgba(255,247,240,0.0) 60%)`
             }}/>
      </div>

      {useLegacy ? (
        <img
          src={treeUrl}
          alt="Sakura tree"
          className="absolute inset-0 w-full h-full object-contain object-bottom select-none transition-all duration-[1500ms]"
          style={{
            filter: treeFilter,
            opacity: 0.98,
            WebkitMaskImage: "radial-gradient(ellipse 75% 85% at 50% 50%, black 60%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 75% 85% at 50% 50%, black 60%, transparent 100%)",
          }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          data-testid="sakura-tree-image"
        />
      ) : (
        <div className="tree-stage-canvas" style={{ filter: treeFilter }}>
          {STAGES.map((key) => (
            <div key={key} className={`stage-layer stage-${key} ${key === stage ? "active" : ""}`} aria-hidden={key !== stage}>
              {renderStageArt(key)}
            </div>
          ))}
        </div>
      )}

      {resting && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-[#7A6F66]/70 bg-white/40 backdrop-blur px-3 py-1 rounded-full" data-testid="tree-resting">
          Tree is resting
        </div>
      )}

      {Array.from({ length: petalCount }).map((_, i) => {
        const left = 10 + ((i * 47) % 80);
        const delay = (i * 0.65) % 12;
        const dur = 9 + (i % 5) * 2;
        const small = i % 3 === 0;
        return (
          <span
            key={`p-${i}`}
            className={`petal ${small ? 'petal-small' : ''}`}
            style={{
              left: `${left}%`,
              top: `-5%`,
              animation: `petal-fall ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}

      {Array.from({ length: fireflyCount }).map((_, i) => {
        const left = 10 + ((i * 37) % 80);
        const top = 20 + ((i * 53) % 60);
        const dur = 6 + (i % 4) * 2;
        return (
          <span
            key={`f-${i}`}
            className="absolute rounded-full pointer-events-none animate-firefly"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: 8, height: 8,
              background: "radial-gradient(circle, rgba(255,245,180,1) 0%, rgba(255,210,120,0.6) 50%, transparent 80%)",
              boxShadow: "0 0 12px rgba(255,220,140,0.9)",
              animationDuration: `${dur}s`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export const TreeStageLabel = ({ stage }) => {
  const meta = stageMeta[stage];
  return <span data-testid="tree-stage-label">{meta?.label || "Sakura"}</span>;
};

export const TreeStagePoetic = ({ stage }) => {
  const meta = stageMeta[stage];
  return <span>{meta?.poetic || "your tree"}</span>;
};
