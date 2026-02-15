"use client";

import React from "react"

import { useEffect, useRef, useState, useCallback } from "react";

// Floating keyword that reacts to cursor
function FloatingWord({
  word,
  x,
  y,
  delay,
  mousePos,
}: {
  word: string;
  x: number;
  y: number;
  delay: number;
  mousePos: { x: number; y: number };
}) {
  const repelStrength = 60;
  const dx = x - mousePos.x;
  const dy = y - mousePos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = 250;
  const factor = dist < maxDist ? (1 - dist / maxDist) * repelStrength : 0;
  const offsetX = dist > 0 ? (dx / dist) * factor : 0;
  const offsetY = dist > 0 ? (dy / dist) * factor : 0;

  return (
    <span
      className="absolute font-serif italic text-foreground/[0.06] select-none pointer-events-none whitespace-nowrap"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        fontSize: `clamp(0.75rem, ${1.2 + delay * 0.4}vw, 1.6rem)`,
        transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`,
        transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        animationDelay: `${delay * 0.2}s`,
        animation: `heroWordFloat ${6 + delay * 1.5}s ease-in-out infinite`,
      }}
    >
      {word}
    </span>
  );
}

// Character-by-character text reveal
function RevealText({
  text,
  className,
  baseDelay,
  style,
  ready = true,
}: {
  text: string;
  className?: string;
  baseDelay: number;
  style?: React.CSSProperties;
  ready?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => setVisible(true), baseDelay * 1000);
    return () => clearTimeout(timer);
  }, [baseDelay, ready]);

  return (
    <span ref={ref} className={className} style={style} aria-label={text}>
      {text.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="inline-block"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateY(0) rotateX(0deg)"
              : "translateY(100%) rotateX(-80deg)",
            transition: `opacity 0.5s ease, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)`,
            transitionDelay: `${i * 0.04}s`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

// Animated SVG ring ornament
function OrnamentRing() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: "min(700px, 90vw)",
        height: "min(700px, 90vw)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 500 500" className="w-full h-full">
        {/* Outer ring - draws itself */}
        <circle
          cx="250"
          cy="250"
          r="220"
          fill="none"
          stroke="hsl(348, 100%, 60%)"
          strokeWidth="0.5"
          strokeDasharray="1382"
          strokeDashoffset="1382"
          opacity="0.2"
          style={{
            animation: "heroRingDraw 3s ease-out 0.5s forwards",
          }}
        />
        {/* Inner dashed ring - rotates */}
        <circle
          cx="250"
          cy="250"
          r="190"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.3"
          strokeDasharray="6 12"
          opacity="0.08"
          style={{
            animation: "heroRingSpin 60s linear infinite",
            transformOrigin: "250px 250px",
          }}
        />
        {/* Middle accent arc */}
        <path
          d="M 250 40 A 210 210 0 0 1 460 250"
          fill="none"
          stroke="hsl(348, 100%, 60%)"
          strokeWidth="1"
          strokeDasharray="330"
          strokeDashoffset="330"
          strokeLinecap="round"
          opacity="0.3"
          style={{
            animation: "heroRingDraw 2s ease-out 1.2s forwards",
          }}
        />
        {/* Small decorative dots on the ring */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 250 + 220 * Math.cos(rad);
          const cy = 250 + 220 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="2"
              fill="hsl(348, 100%, 60%)"
              opacity="0"
              style={{
                animation: `heroDotAppear 0.5s ease-out ${1 + angle * 0.003}s forwards`,
              }}
            />
          );
        })}
        {/* Crosshair at center */}
        <line
          x1="240"
          y1="250"
          x2="260"
          y2="250"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.5"
          opacity="0.1"
        />
        <line
          x1="250"
          y1="240"
          x2="250"
          y2="260"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.5"
          opacity="0.1"
        />
      </svg>
    </div>
  );
}

// Floating accent lines
function AccentLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Diagonal line top-left */}
      <div
        className="absolute"
        style={{
          top: "12%",
          left: "8%",
          width: "120px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, hsl(348, 100%, 60%), transparent)",
          opacity: 0,
          transform: "rotate(-30deg)",
          animation: "heroLineAppear 1s ease-out 1.5s forwards",
        }}
      />
      {/* Diagonal line bottom-right */}
      <div
        className="absolute"
        style={{
          bottom: "18%",
          right: "10%",
          width: "80px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, hsl(var(--foreground)), transparent)",
          opacity: 0,
          transform: "rotate(25deg)",
          animation: "heroLineAppear 1s ease-out 1.8s forwards",
        }}
      />
      {/* Vertical accent */}
      <div
        className="absolute hidden md:block"
        style={{
          top: "20%",
          right: "15%",
          width: "1px",
          height: "60px",
          background: "linear-gradient(180deg, hsl(348, 100%, 60%), transparent)",
          opacity: 0,
          animation: "heroLineAppear 1s ease-out 2s forwards",
        }}
      />
    </div>
  );
}

const FLOATING_WORDS = [
  { word: "Credibility", x: 12, y: 18 },
  { word: "Privacy", x: 82, y: 15 },
  { word: "Ownership", x: 8, y: 72 },
  { word: "Decentralized", x: 78, y: 78 },
  { word: "Trust", x: 22, y: 42 },
  { word: "Verified", x: 88, y: 48 },
  { word: "Secure", x: 48, y: 12 },
  { word: "Freedom", x: 52, y: 88 },
  { word: "On-Chain", x: 15, y: 90 },
  { word: "Authentic", x: 85, y: 88 },
];

export default function HeroSection({ enterReady = false }: { enterReady?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [mounted, setMounted] = useState(false);
  const [pillVisible, setPillVisible] = useState(false);
  const [descVisible, setDescVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Delay hero animations until the page transition is underway
  useEffect(() => {
    if (!enterReady) return;
    const extraDelay = 400; // wait for the stagger wrapper to start revealing
    setMounted(true);
    const t1 = setTimeout(() => setPillVisible(true), extraDelay + 200);
    const t2 = setTimeout(() => setDescVisible(true), extraDelay + 1400);
    const t3 = setTimeout(() => setCtaVisible(true), extraDelay + 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [enterReady]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  // Parallax offset for background elements based on cursor
  const parallaxX = (mousePos.x - 50) * 0.15;
  const parallaxY = (mousePos.y - 50) * 0.15;

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-24 px-6"
    >
      {/* Soft radial light that follows cursor */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-out"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 107, 107, 0.05) 0%, transparent 50%), radial-gradient(circle at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(230, 220, 210, 0.08) 0%, transparent 40%)`,
        }}
      />

      {/* Ornamental SVG ring */}
      <div
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <OrnamentRing />
      </div>

      {/* Floating cursor-reactive words */}
      {mounted &&
        FLOATING_WORDS.map((w, i) => (
          <FloatingWord
            key={w.word}
            word={w.word}
            x={w.x}
            y={w.y}
            delay={i}
            mousePos={mousePos}
          />
        ))}

      {/* Accent lines */}
      <AccentLines />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge pill */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2 bg-card border border-border rounded-full text-xs font-medium uppercase tracking-widest text-muted-foreground mb-10"
          style={{
            opacity: pillVisible ? 1 : 0,
            transform: pillVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
            transition: "all 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "hsl(348, 100%, 60%)",
              animation: "pulse-soft 2s ease-in-out infinite",
            }}
          />
          The Future of Social Media
        </div>

        {/* Headline */}
        <h1 className="font-serif leading-none mb-8">
          <RevealText
            text="social media of"
            className="block text-base md:text-lg font-light tracking-[0.3em] uppercase text-muted-foreground mb-6"
            baseDelay={0.3}
            ready={pillVisible}
          />
          <span className="block relative">
            <span
  style={{
    fontSize: "clamp(3rem, 10vw, 7.5rem)",
    lineHeight: "0.95",
    background:
      "linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(348, 100%, 60%) 60%, #ee5a6f 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
>
  NEW WORLD
</span>

            
            {/* Decorative underline that draws itself */}
            <svg
              className="absolute -bottom-2 left-1/2 -translate-x-1/2"
              width="200"
              height="12"
              viewBox="0 0 200 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M 0 8 Q 50 0, 100 6 T 200 4"
                stroke="hsl(348, 100%, 60%)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="210"
                strokeDashoffset="210"
                opacity="0.5"
                style={{
                  animation: "heroRingDraw 1.5s ease-out 1.6s forwards",
                }}
              />
            </svg>
          </span>
        </h1>

        {/* Description */}
        <p
          className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-12 leading-relaxed"
          style={{
            opacity: descVisible ? 1 : 0,
            transform: descVisible ? "translateY(0)" : "translateY(16px)",
            transition: "all 1s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          We want to bring a new era of social media where users have full
          control over their data and content.
        </p>

        {/* CTA */}
        <div
          className="flex flex-wrap gap-5 justify-center items-center"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <a
            href="#services"
            className="group relative px-10 py-4 rounded-full text-base font-medium overflow-hidden transition-transform duration-300 hover:-translate-y-1"
            style={{
              backgroundColor: "hsl(var(--foreground))",
              color: "hsl(var(--background))",
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Get started
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
            {/* Hover shimmer */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background:
                  "linear-gradient(135deg, hsl(348, 100%, 60%) 0%, hsl(var(--foreground)) 50%)",
              }}
            />
          </a>
          <a
            href="#contact"
            className="px-8 py-4 rounded-full text-base font-medium border border-border text-muted-foreground transition-all duration-300 hover:border-foreground hover:text-foreground"
          >
            Learn more
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        style={{
          opacity: ctaVisible ? 1 : 0,
          transition: "opacity 1s ease 0.5s",
        }}
      >
        <span className="text-xs text-muted-foreground uppercase tracking-widest">
          Scroll
        </span>
        <div className="relative w-5 h-8 rounded-full border border-border flex justify-center">
          <div
            className="w-1 h-2 rounded-full mt-1.5"
            style={{
              backgroundColor: "hsl(348, 100%, 60%)",
              animation: "heroScrollDot 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes heroRingDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes heroRingSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes heroDotAppear {
          to { opacity: 0.35; }
        }
        @keyframes heroLineAppear {
          to { opacity: 0.15; }
        }
        @keyframes heroWordFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-12px); }
        }
        @keyframes heroScrollDot {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.3; transform: translateY(8px); }
        }
      `}</style>
    </section>
  );
}
