import React from "react";
import { BACKEND_URL } from "../lib/api";

export const STAGES = [
  "seed", "sprout", "seedling", "growing", "mature", "blooming", "radiant",
];

export const stageThresholds = {
  seed: 0, sprout: 1, seedling: 5, growing: 12, mature: 25, blooming: 50, radiant: 100,
};

const stageMeta = {
  seed:     { bloom: 0.0,  fireflies: 0,  petals: 0,  label: "Seed",              poetic: "A seed in soft soil" },
  sprout:   { bloom: 0.05, fireflies: 1,  petals: 0,  label: "Tiny Sprout",       poetic: "A tiny green sprout" },
  seedling: { bloom: 0.18, fireflies: 2,  petals: 2,  label: "Small Sapling",     poetic: "A small sapling finding root" },
  growing:  { bloom: 0.4,  fireflies: 4,  petals: 4,  label: "Young Tree",        poetic: "A young tree with thin branches" },
  mature:   { bloom: 0.65, fireflies: 6,  petals: 6,  label: "Mature Green Tree", poetic: "Dense green leaves, steady trunk" },
  blooming: { bloom: 0.88, fireflies: 9,  petals: 12, label: "Blossoms Beginning",poetic: "Pink petals begin to open" },
  radiant:  { bloom: 1.0,  fireflies: 13, petals: 18, label: "Radiant Sakura",    poetic: "Peak radiance in full bloom" },
  young_tree:      { bloom: 0.4,  fireflies: 4, label: "Growing Tree",  poetic: "Branches finding sky" },
  growing_sakura:  { bloom: 0.65, fireflies: 6, label: "Mature Tree",   poetic: "Strong and steady" },
  blooming_sakura: { bloom: 0.88, fireflies: 9, label: "Blooming Sakura", poetic: "In full bloom" },
  ancient_sakura:  { bloom: 1.0,  fireflies: 13, label: "Radiant Sakura", poetic: "Peak radiance" },
};

// 5-petal cherry blossom flower component
const Blossom = ({ cx, cy, size = 1, deep = false }) => {
  const r = 5.5 * size;
  const pr = 3.2 * size;
  const ph = 6 * size;
  const fill = deep ? "#DC6B8A" : "#F8CFDF";
  const center = deep ? "#FFB7C5" : "#FFD5E5";
  return (
    <g transform={`translate(${cx},${cy})`}>
      {[0, 72, 144, 216, 288].map(deg => (
        <ellipse key={deg} cx={0} cy={-r} rx={pr} ry={ph}
          fill={fill} opacity={0.93}
          transform={`rotate(${deg})`}/>
      ))}
      <circle cx={0} cy={0} r={pr * 0.75} fill={center}/>
      <circle cx={0} cy={0} r={pr * 0.3} fill={deep ? "#E68AA1" : "#FFAEC0"}/>
    </g>
  );
};

const ground = (
  <>
    <ellipse cx="160" cy="362" rx="145" ry="22"
      fill="rgba(200,175,155,0.65)"/>
    <ellipse cx="155" cy="370" rx="115" ry="11"
      fill="rgba(175,145,125,0.3)"/>
    <path d="M55 362 C90 355 130 358 160 360 C190 358 225 355 265 362"
      fill="none" stroke="rgba(150,115,90,0.25)" strokeWidth="2"/>
  </>
);

const TrunkTexture = ({ d, sw }) => (
  <>
    <path d={d} stroke="#4A2E1E" strokeWidth={sw} strokeLinecap="round" fill="none"/>
    <path d={d} stroke="rgba(255,255,255,0.12)" strokeWidth={sw * 0.3} strokeLinecap="round" fill="none"/>
  </>
);

const renderStageArt = (stage) => {
  switch (stage) {
    case "seed":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          <defs>
            <radialGradient id="soil" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(130,80,50,0.3)"/>
              <stop offset="100%" stopColor="rgba(100,60,35,0)"/>
            </radialGradient>
          </defs>
          {ground}
          <ellipse cx="160" cy="354" rx="24" ry="8" fill="url(#soil)"/>
          <ellipse cx="160" cy="322" rx="9" ry="7" fill="#6B3E26"/>
          <ellipse cx="160" cy="320" rx="5" ry="3.5" fill="#8B5E3C" opacity="0.7"/>
          <path d="M145 335 C152 328 158 322 174 326" fill="none"
            stroke="rgba(90,60,46,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case "sprout":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <TrunkTexture d="M160 344 C158 326 156 308 156 296" sw={6}/>
          <path d="M156 310 C144 294 132 278 138 264"
            stroke="#5A3C2E" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <ellipse cx="135" cy="260" rx="16" ry="11" fill="#7EC85C" opacity="0.95"/>
          <ellipse cx="170" cy="268" rx="16" ry="11" fill="#85D460" opacity="0.9"/>
          <ellipse cx="163" cy="286" rx="13" ry="9"  fill="#75C050" opacity="0.92"/>
          <ellipse cx="145" cy="272" rx="10" ry="7"  fill="#90DC68" opacity="0.7"/>
        </svg>
      );

    case "seedling":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <TrunkTexture d="M160 348 C154 322 150 292 153 262" sw={10}/>
          <path d="M153 280 C135 256 122 236 128 220"
            stroke="#5A3C2E" strokeWidth="5" strokeLinecap="round" fill="none"/>
          <path d="M155 272 C172 250 185 230 179 214"
            stroke="#5A3C2E" strokeWidth="5" strokeLinecap="round" fill="none"/>
          <path d="M153 262 C138 250 128 236 130 224"
            stroke="#5A3C2E" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
          <ellipse cx="126" cy="216" rx="20" ry="14" fill="#6BBF50" opacity="0.95"/>
          <ellipse cx="181" cy="212" rx="20" ry="14" fill="#72CC56" opacity="0.9"/>
          <ellipse cx="155" cy="244" rx="22" ry="12" fill="#65B548" opacity="0.88"/>
          <ellipse cx="140" cy="228" rx="12" ry="8"  fill="#80D060" opacity="0.7"/>
          <ellipse cx="170" cy="226" rx="12" ry="8"  fill="#78C858" opacity="0.7"/>
        </svg>
      );

    case "growing":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <TrunkTexture d="M160 355 C150 310 148 268 153 228" sw={13}/>
          <path d="M153 262 C136 236 116 210 132 186"
            stroke="#5A3C2E" strokeWidth="6" strokeLinecap="round" fill="none"/>
          <path d="M156 252 C172 234 188 212 198 190"
            stroke="#5A3C2E" strokeWidth="6" strokeLinecap="round" fill="none"/>
          <path d="M153 240 C140 220 124 206 140 192"
            stroke="#5A3C2E" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6"/>
          <path d="M157 238 C168 224 180 210 188 196"
            stroke="#5A3C2E" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6"/>
          <ellipse cx="160" cy="160" rx="98" ry="60"  fill="#5A9E42" opacity="0.88"/>
          <ellipse cx="126" cy="148" rx="54" ry="32"  fill="#62A84A" opacity="0.9"/>
          <ellipse cx="190" cy="150" rx="48" ry="30"  fill="#5CA044" opacity="0.85"/>
          <ellipse cx="158" cy="136" rx="40" ry="22"  fill="#6AB050" opacity="0.82"/>
          <ellipse cx="135" cy="138" rx="20" ry="12"  fill="#72BC58" opacity="0.75"/>
          <ellipse cx="182" cy="140" rx="18" ry="12"  fill="#70B856" opacity="0.75"/>
        </svg>
      );

    case "mature":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          {ground}
          <TrunkTexture d="M160 357 C148 300 144 245 152 200" sw={15}/>
          <path d="M152 235 C130 200 110 174 128 150"
            stroke="#5A3C2E" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M156 230 C178 196 200 172 210 148"
            stroke="#5A3C2E" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M153 218 C136 196 120 180 138 164"
            stroke="#5A3C2E" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.55"/>
          <path d="M158 216 C174 192 192 178 198 162"
            stroke="#5A3C2E" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.55"/>
          <path d="M154 205 C144 186 138 172 150 160"
            stroke="#5A3C2E" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
          <ellipse cx="160" cy="144" rx="118" ry="78" fill="#3E7B2C" opacity="0.85"/>
          <ellipse cx="116" cy="132" rx="62" ry="38" fill="#4A8835" opacity="0.9"/>
          <ellipse cx="208" cy="128" rx="58" ry="36" fill="#468030" opacity="0.88"/>
          <ellipse cx="160" cy="118" rx="70" ry="38" fill="#528C3A" opacity="0.82"/>
          <ellipse cx="135" cy="122" rx="30" ry="18" fill="#5E9845" opacity="0.8"/>
          <ellipse cx="188" cy="120" rx="28" ry="18" fill="#5A9440" opacity="0.8"/>
          {/* First hint of blossoms */}
          <circle cx="128" cy="114" r="8" fill="rgba(230,180,200,0.6)"/>
          <circle cx="180" cy="118" r="7" fill="rgba(230,180,200,0.55)"/>
          <circle cx="155" cy="100" r="6" fill="rgba(240,200,215,0.6)"/>
          <circle cx="195" cy="130" r="6" fill="rgba(230,180,200,0.5)"/>
        </svg>
      );

    case "blooming":
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          <circle cx="160" cy="152" r="125"
            fill="rgba(255,220,235,0.12)"/>
          {ground}
          <TrunkTexture d="M160 352 C146 296 141 232 151 186" sw={15}/>
          <path d="M151 224 C130 188 108 162 128 138"
            stroke="#5A3C2E" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M157 230 C178 194 200 168 210 140"
            stroke="#5A3C2E" strokeWidth="7" strokeLinecap="round" fill="none"/>
          <path d="M152 210 C136 186 120 168 138 152"
            stroke="#5A3C2E" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.5"/>
          <path d="M158 208 C176 186 194 170 202 154"
            stroke="#5A3C2E" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.5"/>
          {/* Green-pink transition canopy */}
          <ellipse cx="160" cy="148" rx="122" ry="80" fill="rgba(200,165,185,0.65)"/>
          <ellipse cx="114" cy="138" rx="68" ry="40" fill="rgba(210,175,195,0.7)"/>
          <ellipse cx="208" cy="132" rx="64" ry="38" fill="rgba(205,170,190,0.68)"/>
          <ellipse cx="160" cy="126" rx="76" ry="42" fill="rgba(220,185,205,0.72)"/>
          {/* Cherry blossoms */}
          <Blossom cx={115} cy={120} size={1.1}/>
          <Blossom cx={185} cy={116} size={1.0}/>
          <Blossom cx={150} cy={96}  size={0.9}/>
          <Blossom cx={172} cy={144} size={0.85} deep/>
          <Blossom cx={135} cy={154} size={0.8}/>
          <Blossom cx={196} cy={138} size={0.9} deep/>
          <Blossom cx={125} cy={142} size={0.85}/>
          <Blossom cx={162} cy={110} size={0.95} deep/>
          <Blossom cx={202} cy={118} size={0.8}/>
          <Blossom cx={110} cy={148} size={0.75}/>
        </svg>
      );

    case "radiant": {
      const blossomPositions = [
        [130,108,1.1,true],[175,100,1.05,false],[155,86,0.95,false],[198,120,1.0,true],
        [108,130,0.9,false],[218,108,0.95,true],[145,70,0.85,false],[185,140,1.0,false],
        [120,148,0.88,true],[205,142,0.85,false],[162,126,1.1,true],[138,158,0.82,false],
        [190,160,0.88,true],[115,112,0.9,false],[235,128,0.85,true],[92,148,0.8,false],
        [232,152,0.8,false],[155,50,0.78,true],[178,68,0.82,false],[140,90,0.92,true],
      ];
      return (
        <svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet">
          <defs>
            <radialGradient id="radiantGlow" cx="50%" cy="40%">
              <stop offset="0%"   stopColor="rgba(255,210,225,0.22)"/>
              <stop offset="60%"  stopColor="rgba(255,230,240,0.08)"/>
              <stop offset="100%" stopColor="rgba(255,240,245,0)"/>
            </radialGradient>
          </defs>
          <circle cx="160" cy="148" r="138" fill="url(#radiantGlow)"/>
          {ground}
          <TrunkTexture d="M160 354 C148 290 143 224 152 182" sw={17}/>
          {/* Main branches */}
          <path d="M152 218 C128 182 106 156 128 130"
            stroke="#5A3C2E" strokeWidth="7.5" strokeLinecap="round" fill="none"/>
          <path d="M158 222 C182 184 206 158 218 130"
            stroke="#5A3C2E" strokeWidth="7.5" strokeLinecap="round" fill="none"/>
          {/* Secondary branches */}
          <path d="M152 200 C134 172 118 154 136 136"
            stroke="#5A3C2E" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.5"/>
          <path d="M158 198 C178 172 196 158 208 140"
            stroke="#5A3C2E" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.5"/>
          <path d="M130 130 C114 110 100 90 108 72"
            stroke="#5A3C2E" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4"/>
          <path d="M218 130 C232 110 240 88 234 68"
            stroke="#5A3C2E" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4"/>
          {/* Full canopy — layered for depth */}
          <ellipse cx="160" cy="148" rx="128" ry="86" fill="rgba(248,195,215,0.60)"/>
          <ellipse cx="112" cy="136" rx="72" ry="44" fill="rgba(248,200,218,0.65)"/>
          <ellipse cx="210" cy="130" rx="68" ry="42" fill="rgba(245,195,215,0.63)"/>
          <ellipse cx="158" cy="118" rx="82" ry="48" fill="rgba(252,210,228,0.68)"/>
          <ellipse cx="130" cy="120" rx="44" ry="26" fill="rgba(255,220,235,0.6)"/>
          <ellipse cx="190" cy="116" rx="42" ry="26" fill="rgba(252,215,230,0.62)"/>
          {/* Dense blossoms */}
          {blossomPositions.map(([cx, cy, size, deep], i) => (
            <Blossom key={i} cx={cx} cy={cy} size={size} deep={deep}/>
          ))}
          {/* Golden shimmer dots */}
          {[138,162,110,192,155,178,125,205,148].map((x, i) => (
            <circle key={`g${i}`}
              cx={x} cy={80 + i * 14}
              r={2.5 + (i % 3) * 0.8}
              fill="rgba(255,215,150,0.65)"
              opacity={0.7 + (i % 3) * 0.1}/>
          ))}
        </svg>
      );
    }

    default:
      return renderStageArt("sprout");
  }
};

export const SakuraTree = ({
  stage = "sprout", blossoms = 0, resting = false,
  className = "", useLegacyImage = false
}) => {
  const meta = stageMeta[stage] || stageMeta.sprout;
  const bloom = meta.bloom;
  const fireflyCount = meta.fireflies;
  const petalCount = meta.petals;
  const restingDim = resting ? 0.9 : 1.0;

  const stageGlow = {
    seed:     "rgba(139,90,43,0.08)",
    sprout:   "rgba(122,200,92,0.12)",
    seedling: "rgba(100,185,78,0.14)",
    growing:  "rgba(90,160,64,0.16)",
    mature:   "rgba(62,123,44,0.18)",
    blooming: "rgba(220,130,170,0.22)",
    radiant:  "rgba(230,138,161,0.28)",
  };

  const treeFilter = `drop-shadow(0 28px 38px ${stageGlow[stage] || "rgba(230,138,161,0.12)"}) saturate(${0.9 + bloom * 0.25}) brightness(${restingDim})`;
  const treeUrl = `${BACKEND_URL}/api/tree/image`;
  const useLegacy = useLegacyImage || false;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} data-testid="sakura-tree">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full"
          style={{
            background: `radial-gradient(ellipse at center, ${stageGlow[stage] || "rgba(255,183,197,0.15)"} 0%, rgba(255,247,240,0.0) 65%)`
          }}/>
      </div>

      {useLegacy ? (
        <img src={treeUrl} alt="Sakura tree"
          className="absolute inset-0 w-full h-full object-contain object-bottom select-none transition-all duration-[1500ms]"
          style={{ filter: treeFilter, opacity: 0.98 }}
          onError={e => { e.currentTarget.style.display = "none"; }}
          data-testid="sakura-tree-image"/>
      ) : (
        <div className="tree-stage-canvas" style={{ filter: treeFilter }}>
          {STAGES.map(key => (
            <div key={key}
              className={`stage-layer stage-${key} ${key === stage ? "active" : ""}`}
              aria-hidden={key !== stage}>
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

      {/* Falling petals — only bloom/radiant stages, limited count for performance */}
      {petalCount > 0 && Array.from({ length: Math.min(petalCount, 10) }).map((_, i) => {
        const left = 10 + ((i * 47) % 80);
        const delay = (i * 0.8) % 12;
        const dur = 9 + (i % 4) * 2.5;
        return (
          <span key={`p-${i}`}
            className={`petal ${i % 3 === 0 ? "petal-small" : ""}`}
            style={{
              left: `${left}%`, top: "-5%",
              animation: `petal-fall ${dur}s linear ${delay}s infinite`,
              willChange: "transform",
            }}/>
        );
      })}

      {/* Fireflies — limited for performance */}
      {Array.from({ length: Math.min(fireflyCount, 8) }).map((_, i) => {
        const left = 12 + ((i * 37) % 76);
        const top  = 22 + ((i * 53) % 56);
        const dur  = 7 + (i % 4) * 2;
        return (
          <span key={`f-${i}`}
            className="absolute rounded-full pointer-events-none animate-firefly"
            style={{
              left: `${left}%`, top: `${top}%`,
              width: 7, height: 7,
              background: "radial-gradient(circle, rgba(255,245,180,1) 0%, rgba(255,210,120,0.6) 50%, transparent 80%)",
              boxShadow: "0 0 10px rgba(255,220,140,0.85)",
              animationDuration: `${dur}s`,
              animationDelay: `${i * 0.7}s`,
              willChange: "transform, opacity",
            }}/>
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
