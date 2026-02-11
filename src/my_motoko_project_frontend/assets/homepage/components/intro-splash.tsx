"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface IntroSplashProps {
  onComplete: () => void;
}

export default function IntroSplash({ onComplete }: IntroSplashProps) {
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onComplete(), 1200);
  }, [onComplete, exiting]);

  // Phase timeline
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),    // Lines draw
      setTimeout(() => setPhase(2), 1200),   // Orb appears
      setTimeout(() => setPhase(3), 2200),   // Text reveals
      setTimeout(() => setPhase(4), 3200),   // Tagline
      setTimeout(() => setPhase(5), 4000),   // Enter button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const parallax = (strength: number) => ({
    transform: `translate(${(mousePos.x - 0.5) * strength}px, ${(mousePos.y - 0.5) * strength}px)`,
  });

  const combineTransforms = (primary: string, parallaxStrength: number) => ({
    transform: `${primary} translate(${(mousePos.x - 0.5) * parallaxStrength}px, ${(mousePos.y - 0.5) * parallaxStrength}px)`,
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: "#faf9f7",
        clipPath: exiting
          ? "circle(0% at 50% 50%)"
          : "circle(150% at 50% 50%)",
        transition: exiting
          ? "clip-path 1.2s cubic-bezier(0.76, 0, 0.24, 1)"
          : "none",
      }}
    >
      {/* Animated gradient orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60vmin",
          height: "60vmin",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 40% 40%, hsl(348 100% 85% / 0.4), hsl(348 100% 60% / 0.15) 50%, transparent 70%)",
          filter: "blur(60px)",
          opacity: phase >= 2 ? 1 : 0,
          ...combineTransforms(`scale(${phase >= 2 ? 1 : 0.3})`, 20),
          transition: "opacity 1.8s ease, transform 2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        aria-hidden="true"
      />

      {/* Second smaller orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "30vmin",
          height: "30vmin",
          borderRadius: "50%",
          top: "25%",
          right: "20%",
          background:
            "radial-gradient(circle, hsl(260 80% 80% / 0.25), transparent 70%)",
          filter: "blur(50px)",
          opacity: phase >= 2 ? 0.8 : 0,
          transition: "opacity 2s ease 0.3s",
          ...parallax(-15),
        }}
        aria-hidden="true"
      />

      {/* SVG decorative lines that draw themselves */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Horizontal center line */}
        <line
          x1="0"
          y1="450"
          x2="1440"
          y2="450"
          stroke="hsl(0 0% 10% / 0.06)"
          strokeWidth="1"
          strokeDasharray="1440"
          strokeDashoffset={phase >= 1 ? "0" : "1440"}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.65, 0, 0.35, 1)" }}
        />
        {/* Vertical center line */}
        <line
          x1="720"
          y1="0"
          x2="720"
          y2="900"
          stroke="hsl(0 0% 10% / 0.06)"
          strokeWidth="1"
          strokeDasharray="900"
          strokeDashoffset={phase >= 1 ? "0" : "900"}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.65, 0, 0.35, 1) 0.2s" }}
        />
        {/* Outer circle */}
        <circle
          cx="720"
          cy="450"
          r="280"
          fill="none"
          stroke="hsl(348 100% 60% / 0.08)"
          strokeWidth="1"
          strokeDasharray="1759.29"
          strokeDashoffset={phase >= 1 ? "0" : "1759.29"}
          style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.65, 0, 0.35, 1) 0.4s" }}
        />
        {/* Inner circle */}
        <circle
          cx="720"
          cy="450"
          r="180"
          fill="none"
          stroke="hsl(0 0% 10% / 0.04)"
          strokeWidth="1"
          strokeDasharray="1130.97"
          strokeDashoffset={phase >= 1 ? "0" : "1130.97"}
          style={{ transition: "stroke-dashoffset 2.2s cubic-bezier(0.65, 0, 0.35, 1) 0.6s" }}
        />
        {/* Diagonal accent */}
        <line
          x1="300"
          y1="150"
          x2="1140"
          y2="750"
          stroke="hsl(348 100% 60% / 0.04)"
          strokeWidth="1"
          strokeDasharray="1131"
          strokeDashoffset={phase >= 1 ? "0" : "1131"}
          style={{ transition: "stroke-dashoffset 2.5s cubic-bezier(0.65, 0, 0.35, 1) 0.3s" }}
        />
      </svg>

      {/* Floating geometric shapes - cursor reactive */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%",
          left: "12%",
          width: 60,
          height: 60,
          border: "1px solid hsl(348 100% 60% / 0.12)",
          borderRadius: "50%",
          opacity: phase >= 2 ? 1 : 0,
          transform: `rotate(${45 + mousePos.x * 30}deg)`,
          transition: "opacity 1s ease 0.2s",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "20%",
          right: "15%",
          width: 40,
          height: 40,
          border: "1px solid hsl(0 0% 10% / 0.08)",
          transform: `rotate(${mousePos.y * 60}deg)`,
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 1s ease 0.4s",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "70%",
          left: "20%",
          width: 24,
          height: 24,
          borderRadius: "2px",
          border: "1px solid hsl(348 100% 60% / 0.1)",
          transform: `rotate(${45 + mousePos.x * 20}deg)`,
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 1s ease 0.6s",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "25%",
          right: "25%",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "hsl(348 100% 60% / 0.2)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 1s ease 0.8s",
          ...parallax(-30),
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "35%",
          left: "30%",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "hsl(260 80% 70% / 0.2)",
          opacity: phase >= 2 ? 1 : 0,
          transition: "opacity 1s ease 1s",
          ...parallax(25),
        }}
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center" style={parallax(8)}>
        {/* Small top label */}
        <span
          className="block text-xs tracking-[0.4em] uppercase mb-8"
          style={{
            color: "hsl(var(--muted-foreground))",
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? "translateY(0)" : "translateY(-10px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          est. 2025
        </span>

        {/* TUAMS text — staggered character reveal with clip mask */}
        <div className="relative mb-4" aria-label="TUAMS">
          <div className="flex items-baseline">
            {"TUAMS".split("").map((char, i) => (
              <span
                key={`${char}-${i}`}
                className="inline-block overflow-hidden"
              >
                <span
                  className="inline-block font-serif font-light"
                  style={{
                    fontSize: "clamp(4rem, 15vw, 12rem)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                    color: "hsl(var(--foreground))",
                    transform: phase >= 3
                      ? "translateY(0) rotateX(0deg)"
                      : "translateY(110%) rotateX(-40deg)",
                    opacity: phase >= 3 ? 1 : 0,
                    transition: `transform 1s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s, opacity 0.6s ease ${i * 0.1}s`,
                  }}
                >
                  {char}
                </span>
              </span>
            ))}
          </div>

          {/* Underline accent that draws from left to right */}
          <div
            className="absolute -bottom-2 left-0 h-[2px]"
            style={{
              background: "linear-gradient(90deg, hsl(var(--accent)), hsl(348 100% 75%), transparent)",
              width: phase >= 3 ? "100%" : "0%",
              transition: "width 1.2s cubic-bezier(0.65, 0, 0.35, 1) 0.6s",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Divider line */}
        <div
          className="my-6"
          style={{
            width: phase >= 4 ? 80 : 0,
            height: 1,
            background: "hsl(var(--foreground) / 0.15)",
            transition: "width 0.8s cubic-bezier(0.65, 0, 0.35, 1)",
          }}
          aria-hidden="true"
        />

        {/* Tagline */}
        <p
          className="text-sm md:text-base tracking-[0.3em] uppercase"
          style={{
            color: "hsl(var(--muted-foreground))",
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 1s ease, transform 1s ease",
          }}
        >
          bringing the new world
        </p>

        {/* Enter button with magnetic hover effect */}
        <button
          type="button"
          onClick={handleEnter}
          className="group mt-12 relative cursor-pointer"
          style={{
            opacity: phase >= 5 ? 1 : 0,
            transform: phase >= 5 ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
          aria-label="Enter site"
        >
          {/* Spinning ring around button */}
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none"
            viewBox="0 0 200 60"
            aria-hidden="true"
          >
            <rect
              x="1"
              y="1"
              width="198"
              height="58"
              rx="29"
              fill="none"
              stroke="hsl(348 100% 60% / 0.15)"
              strokeWidth="1"
              strokeDasharray="4 8"
              className="origin-center"
              style={{ animation: "spin 20s linear infinite" }}
            />
          </svg>
          <span
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-xs font-medium uppercase tracking-[0.25em] border border-foreground/10 transition-all duration-500 group-hover:border-accent group-hover:text-accent-foreground group-hover:bg-accent group-hover:shadow-lg"
            style={{
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
            }}
          >
            <span>Explore</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      {/* Skip */}
      {phase < 5 && (
        <button
          type="button"
          onClick={handleEnter}
          className="absolute bottom-8 right-8 z-20 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-300 cursor-pointer uppercase tracking-[0.2em]"
          aria-label="Skip intro"
        >
          Skip
        </button>
      )}

      {/* Inline keyframe for the dashed border spin */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
