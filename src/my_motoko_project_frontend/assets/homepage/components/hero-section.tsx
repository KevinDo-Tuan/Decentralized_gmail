"use client";

import { useEffect, useRef } from "react";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-visible");
          }
        }
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll("[data-animate]");
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-16 px-6"
    >
      {/* Subtle background radials */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(136, 100, 234, 0.06) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div
          data-animate
          className="opacity-0 animate-on-scroll inline-block px-5 py-2 bg-card border border-border rounded-full text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8"
          style={{ animationDelay: "0.2s" }}
        >
          Credibility &middot; Privacy &middot; Dependency
        </div>

        <h1 className="font-serif leading-tight mb-8">
          <span
            data-animate
            className="opacity-0 animate-on-scroll block text-base md:text-lg font-light tracking-widest uppercase text-muted-foreground mb-4"
            style={{ animationDelay: "0.3s" }}
          >
            social media of
          </span>
          <span
            data-animate
            className="opacity-0 animate-on-scroll block font-bold italic text-foreground"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 6rem)",
              animationDelay: "0.4s",
              background: "linear-gradient(135deg, hsl(var(--accent)) 0%, #ee5a6f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            NEW WORLD
          </span>
        </h1>

        <p
          data-animate
          className="opacity-0 animate-on-scroll text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ animationDelay: "0.6s" }}
        >
          We want to bring a new era of social media where users have full
          control over their data and content.
        </p>

        <div
          data-animate
          className="opacity-0 animate-on-scroll flex flex-wrap gap-4 justify-center"
          style={{ animationDelay: "0.7s" }}
        >
          <a
            href="#services"
            className="px-10 py-4 bg-card text-muted-foreground rounded-full text-base font-medium border-2 border-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:border-accent hover:-translate-y-1"
            style={{ boxShadow: "0 8px 24px rgba(255, 51, 102, 0.15)" }}
          >
            Try it out now
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">
          Scroll down
        </span>
        <div
          className="w-0.5 h-12 rounded-full"
          style={{
            background: "linear-gradient(to bottom, hsl(var(--accent)), transparent)",
            animation: "pulse-soft 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}
