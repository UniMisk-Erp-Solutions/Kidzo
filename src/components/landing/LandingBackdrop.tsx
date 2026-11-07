/**
 * Soft, drifting colour pools behind the public pages. Sits in a negative-z layer inside an `isolate` wrapper so it is
 * always behind text and never intercepts clicks. (The floating icons, polaroids, hearts and sparkles were removed.)
 */
export const LandingBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    {/* soft drifting colour pools */}
    <div className="blob drift left-[-8%] top-[4%] h-80 w-80 opacity-50" style={{ background: "hsl(var(--wash-coral) / 0.45)" }} />
    <div className="blob drift right-[-6%] top-[22%] h-96 w-96 opacity-60" style={{ background: "hsl(var(--wash-mustard) / 0.4)", animationDelay: "-5s" }} />
    <div className="blob drift left-[20%] top-[52%] h-96 w-96 opacity-50" style={{ background: "hsl(var(--wash-lilac) / 0.7)", animationDelay: "-9s" }} />
    <div className="blob drift right-[8%] top-[78%] h-80 w-80 opacity-50" style={{ background: "hsl(var(--wash-coral) / 0.35)", animationDelay: "-2s" }} />
  </div>
);
