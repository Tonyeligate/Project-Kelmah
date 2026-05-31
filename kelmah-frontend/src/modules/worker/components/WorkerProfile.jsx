import { useState } from "react";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const G   = "#e8a820";        // base gold
const GHI = "#f5c842";        // bright gold / stars
const GLO = "#9a6200";        // deep gold
const PAGE = "#0c0c0c";
const CARD = "#1b1b1b";
const HDR  = "#1a1308";       // warm brown-dark for header
const W    = "#ffffff";
const SUB  = "#b0874a";       // subtitle warm gold
const GRY  = "#626262";       // body grey

// ─── Images ──────────────────────────────────────────────────────────────────
const PROFILE_URL  = "https://randomuser.me/api/portraits/men/32.jpg";
const PORTFOLIO    = [
  "https://loremflickr.com/240/180/wood,shelf?lock=11",
  "https://loremflickr.com/240/180/wooden,furniture?lock=22",
  "https://loremflickr.com/240/180/roofing,building?lock=33",
  "https://loremflickr.com/240/180/woodwork,craft?lock=44",
];
const REVIEWS = [
  { photo: "https://randomuser.me/api/portraits/men/55.jpg",   initials: "AK", stars: 4, text: "The craftsmanship during our treatment far exceeded our expectations. Truly outstanding." },
  { photo: "https://randomuser.me/api/portraits/men/68.jpg",   initials: "KO", stars: 4, text: "Extremely professional and thorough. Delivered on time and within budget." },
  { photo: "https://randomuser.me/api/portraits/women/44.jpg", initials: "AS", stars: 5, text: "Top-quality work from start to finish. Very satisfied and highly recommended." },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function FallbackAvatar({ initials, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#2a1e0e", border: `1.5px solid ${G}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: G, fontSize: size * 0.34, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
}

function SafeImg({ src, alt, style, fallback }) {
  const [err, setErr] = useState(false);
  if (err) return fallback ?? null;
  return <img src={src} alt={alt} style={style} onError={() => setErr(true)} />;
}

function Stars({ n }) {
  return (
    <span style={{ color: GHI, fontSize: 12, letterSpacing: 2 }}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CraftsmanProfile() {
  const [expanded, setExpanded] = useState(false);

  const aboutShort = "I am a master carpenter and builder with over 15 years of hands-on experience across Accra. I combine traditional Ghanaian joinery with modern precision — from custom furniture to full roofing installations. Carpenter and trusted builder.";
  const aboutFull  = "I am a master carpenter and builder with over 15 years of hands-on experience across Accra and beyond. My craft blends traditional Ghanaian joinery with modern precision — from custom furniture and bespoke woodwork to full roofing installations. Every project I take on reflects my dedication to quality, durability, and beauty. I work closely with clients to bring their vision to life, on time and on budget. Available for both residential and commercial projects.";

  return (
    <div style={{
      minHeight: "100vh",
      background: PAGE,
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "28px 14px 60px",
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    }}>
      <div style={{
        background: CARD,
        borderRadius: 26,
        width: "100%",
        maxWidth: 365,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.04)",
      }}>

        {/* ════ HEADER ════ */}
        <div style={{
          background: `linear-gradient(175deg, ${HDR} 0%, ${CARD} 100%)`,
          padding: "26px 20px 0",
        }}>
          {/* Avatar + Name row */}
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>

            {/* Glowing gold ring */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
              padding: 3,
              background: `linear-gradient(135deg, ${GHI} 0%, ${G} 55%, ${GLO} 100%)`,
              boxShadow: `0 0 0 4px rgba(245,200,66,0.12), 0 0 22px rgba(245,200,66,0.42)`,
            }}>
              <SafeImg
                src={PROFILE_URL}
                alt="Kwadjo"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }}
                fallback={<FallbackAvatar initials="KA" size={74} />}
              />
            </div>

            {/* Name / title / rating */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ color: W, fontSize: 20, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.1, letterSpacing: "-0.2px" }}>
                Kwadjo Asamoah
              </h1>
              <p style={{ color: SUB, fontSize: 12, margin: "0 0 8px", fontWeight: 400 }}>
                Master Carpenter & Builder
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: GHI, fontWeight: 700, fontSize: 15 }}>4.9</span>
                <span style={{ color: GHI, fontSize: 14, letterSpacing: 1 }}>★★</span>
                <span style={{ color: "#4e4e4e", fontSize: 10.5 }}>(200+ Reviews)</span>
              </div>
            </div>
          </div>

          {/* Skill pills */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", padding: "14px 0 18px" }}>
            {["Carpentry", "Furniture Making", "Roofing"].map(s => (
              <span key={s} style={{
                background: "rgba(232,168,32,0.10)",
                border: "1px solid rgba(232,168,32,0.32)",
                color: G, borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11, fontWeight: 600,
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* ════ ABOUT ME ════ */}
        <div style={{ padding: "16px 20px 0" }}>
          <h2 style={sh2}>About Me</h2>
          <p style={{ color: GRY, fontSize: 12.5, lineHeight: 1.68, margin: 0 }}>
            {expanded ? aboutFull : aboutShort}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                background: `linear-gradient(135deg, ${GHI} 0%, #c07800 100%)`,
                color: "#150f00",
                border: "none", borderRadius: 6,
                padding: "5px 14px",
                fontSize: 11.5, fontWeight: 700, cursor: "pointer",
              }}
            >{expanded ? "Read Less" : "Read More"}</button>
          </div>
        </div>

        {/* ════ PORTFOLIO ════ */}
        <div style={{ padding: "16px 0 0" }}>
          <h2 style={{ ...sh2, paddingLeft: 20 }}>Portfolio</h2>
          <div style={{
            display: "flex", gap: 8,
            overflowX: "auto", scrollbarWidth: "none",
            paddingLeft: 20, paddingRight: 12, paddingBottom: 2,
          }}>
            {PORTFOLIO.map((src, i) => (
              <SafeImg
                key={i}
                src={src}
                alt={`Work ${i + 1}`}
                style={{ width: 112, height: 84, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#2a2a2a" }}
                fallback={
                  <div style={{ width: 112, height: 84, borderRadius: 10, flexShrink: 0, background: ["#2e1e0e","#1e2a1e","#1e1e2e","#2a2010"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                    {["🪵","🛋️","🏠","🪑"][i]}
                  </div>
                }
              />
            ))}
          </div>
        </div>

        {/* Gold divider */}
        <div style={{
          margin: "16px 20px 0",
          height: 2,
          background: `linear-gradient(90deg, ${G} 0%, rgba(232,168,32,0.06) 100%)`,
          borderRadius: 2,
        }} />

        {/* ════ REVIEWS ════ */}
        <div style={{ padding: "14px 20px 0" }}>
          <h2 style={sh2}>Reviews</h2>
          {REVIEWS.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 13, alignItems: "flex-start" }}>
              <SafeImg
                src={r.photo}
                alt=""
                style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1.5px solid #2e2e2e", background: "#2a2a2a" }}
                fallback={<FallbackAvatar initials={r.initials} />}
              />
              <div style={{ flex: 1 }}>
                <Stars n={r.stars} />
                <p style={{ color: GRY, fontSize: 12, lineHeight: 1.55, margin: "3px 0 0" }}>{r.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ════ CTA BUTTONS ════ */}
        <div style={{ padding: "10px 20px 30px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={{
            width: "100%",
            background: `linear-gradient(135deg, ${GHI} 0%, ${G} 55%, ${GLO} 100%)`,
            color: "#150e00",
            border: "none", borderRadius: 13,
            padding: 16,
            fontSize: 14, fontWeight: 800, cursor: "pointer",
            letterSpacing: "0.14em", textTransform: "uppercase",
            boxShadow: `0 5px 24px rgba(232,168,32,0.32)`,
          }}>
            Hire Now
          </button>
          <button style={{
            width: "100%",
            background: "#222222",
            color: W,
            border: "1.5px solid rgba(232,168,32,0.22)",
            borderRadius: 13,
            padding: 15,
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.14em", textTransform: "uppercase",
          }}>
            Message
          </button>
        </div>

      </div>
    </div>
  );
}

// Shared section heading style
const sh2 = {
  color: W,
  fontSize: 15,
  fontWeight: 700,
  margin: "0 0 10px",
  letterSpacing: 0.1,
};