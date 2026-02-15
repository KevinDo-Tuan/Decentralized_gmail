"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Data strings that will get "encrypted" on screen
const SAMPLE_DATA = [
  { label: "Name", value: "Sarah Connor", encrypted: "****** ******" },
  { label: "Email", value: "sarah@mail.com", encrypted: "****@*****.com" },
  { label: "Location", value: "Los Angeles, CA", encrypted: "*** *******, **" },
  { label: "Phone", value: "+1 555 012 3456", encrypted: "+* *** *** ****" },
  { label: "Balance", value: "$12,340.00", encrypted: "$**,***.00" },
];

function EncryptedRow({
  label,
  value,
  encrypted,
  isVisible,
  delay,
}: {
  label: string;
  value: string;
  encrypted: string;
  isVisible: boolean;
  delay: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isEncrypted, setIsEncrypted] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // After delay, begin encryption animation
    const startTimer = setTimeout(() => {
      const chars = value.split("");
      let step = 0;
      const scrambleChars = "!@#$%^&*0123456789abcdef";

      const interval = setInterval(() => {
        if (step >= chars.length) {
          clearInterval(interval);
          setDisplayValue(encrypted);
          setIsEncrypted(true);
          return;
        }

        // Replace characters progressively with scramble then mask
        const result = chars.map((char, i) => {
          if (char === " ") return " ";
          if (i < step) return encrypted[i] || "*";
          if (i === step)
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          return char;
        });
        setDisplayValue(result.join(""));
        step++;
      }, 60);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [isVisible, value, encrypted, delay]);

  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : "translateX(20px)",
        transition: `opacity 0.6s ease ${delay * 0.3}ms, transform 0.6s ease ${delay * 0.3}ms`,
      }}
    >
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        {label}
      </span>
      <span
        className="font-mono text-sm transition-colors duration-300"
        style={{
          color: isEncrypted
            ? "hsl(var(--accent))"
            : "hsl(var(--foreground))",
        }}
      >
        {displayValue}
      </span>
    </div>
  );
}

function ShieldSVG({ progress }: { progress: number }) {
  // Shield path (elegant, modern shield shape)
  const shieldPath =
    "M100 10 L180 50 C180 50 185 130 100 190 C15 130 20 50 20 50 Z";
  const shieldLength = 520;

  // Lock body (inside shield)
  const lockBodyPath = "M80 115 L80 100 C80 85 88 75 100 75 C112 75 120 85 120 100 L120 115";
  const lockBodyLength = 100;

  // Lock base
  const lockBasePath = "M75 115 L125 115 L125 145 L75 145 Z";
  const lockBaseLength = 160;

  // Keyhole
  const keyholePath = "M100 125 A5 5 0 1 1 100 135 A5 5 0 1 1 100 125";
  const keyholeLength = 32;

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Subtle glow behind shield */}
      <defs>
        <radialGradient id="shield-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(348 100% 60%)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="hsl(348 100% 60%)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shield-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(348 100% 60%)" stopOpacity="0.6" />
          <stop offset="50%" stopColor="hsl(348 100% 70%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(348 100% 60%)" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="100" r="90" fill="url(#shield-glow)" />

      {/* Shield outline — draws itself */}
      <path
        d={shieldPath}
        fill="none"
        stroke="url(#shield-stroke)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={shieldLength}
        strokeDashoffset={shieldLength - shieldLength * Math.min(progress * 1.5, 1)}
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />

      {/* Shield filled (fades in after outline) */}
      <path
        d={shieldPath}
        fill="hsl(348 100% 60% / 0.03)"
        stroke="none"
        style={{
          opacity: progress > 0.6 ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* Lock shackle */}
      <path
        d={lockBodyPath}
        fill="none"
        stroke="hsl(var(--foreground) / 0.3)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={lockBodyLength}
        strokeDashoffset={
          lockBodyLength - lockBodyLength * Math.max((progress - 0.4) * 2.5, 0)
        }
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />

      {/* Lock body */}
      <path
        d={lockBasePath}
        fill="none"
        stroke="hsl(var(--foreground) / 0.3)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeDasharray={lockBaseLength}
        strokeDashoffset={
          lockBaseLength - lockBaseLength * Math.max((progress - 0.5) * 2.5, 0)
        }
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />

      {/* Lock body fill */}
      <path
        d={lockBasePath}
        fill="hsl(var(--foreground) / 0.04)"
        stroke="none"
        style={{
          opacity: progress > 0.8 ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Keyhole */}
      <circle
        cx="100"
        cy="130"
        r="5"
        fill="none"
        stroke="hsl(348 100% 60% / 0.5)"
        strokeWidth="1.5"
        strokeDasharray={keyholeLength}
        strokeDashoffset={
          keyholeLength - keyholeLength * Math.max((progress - 0.7) * 3.5, 0)
        }
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />

      {/* Keyhole filled */}
      <circle
        cx="100"
        cy="130"
        r="4"
        fill="hsl(348 100% 60% / 0.25)"
        style={{
          opacity: progress > 0.9 ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* Small sparkle dots that appear when complete */}
      {[
        { cx: 60, cy: 40, delay: 0 },
        { cx: 140, cy: 40, delay: 0.1 },
        { cx: 50, cy: 100, delay: 0.2 },
        { cx: 150, cy: 100, delay: 0.15 },
        { cx: 100, cy: 20, delay: 0.05 },
      ].map(({ cx, cy, delay }, i) => (
        <circle
          key={`sparkle-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="1.5"
          fill="hsl(348 100% 60%)"
          style={{
            opacity: progress > 0.9 ? 0.4 : 0,
            transform: `scale(${progress > 0.9 ? 1 : 0})`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
          }}
        />
      ))}
    </svg>
  );
}

export default function PrivacySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const shieldContainerRef = useRef<HTMLDivElement>(null);
  const [shieldProgress, setShieldProgress] = useState(0);
  const [isDataVisible, setIsDataVisible] = useState(false);

  // Track shield draw progress on scroll
  const handleScroll = useCallback(() => {
    if (!shieldContainerRef.current) return;
    const rect = shieldContainerRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Start animating when the top of the section enters viewport bottom
    // Complete when the element is centered in viewport
    const start = windowHeight;
    const end = windowHeight * 0.3;
    const current = rect.top;

    if (current > start) {
      setShieldProgress(0);
    } else if (current < end) {
      setShieldProgress(1);
    } else {
      setShieldProgress(1 - (current - end) / (start - end));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Intersection observer for data rows and other elements
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-visible");
            if (entry.target.hasAttribute("data-trigger-encrypt")) {
              setIsDataVisible(true);
            }
          }
        }
      },
      { threshold: 0.2 }
    );

    const elements = sectionRef.current?.querySelectorAll("[data-animate]");
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="privacy"
      className="py-24 md:py-32 relative overflow-hidden"
    >
      {/* Subtle background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, hsl(348 100% 60% / 0.03) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div
            data-animate
            className="opacity-0 animate-on-scroll inline-flex items-center gap-2 px-5 py-2 bg-card border border-border rounded-full text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Your Data, Your Rules
          </div>
          <h2
            data-animate
            className="opacity-0 animate-on-scroll font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground text-balance"
          >
            <span className="font-semibold italic" style={{ color: "hsl(var(--accent))" }}>
              {"Your privacy is our priority."}
            </span>
          </h2>
        </div>

        {/* Two column: shield + data encryption demo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left — Shield animation */}
          <div
            ref={shieldContainerRef}
            className="relative flex items-center justify-center"
          >
            <div className="w-64 h-64 md:w-80 md:h-80 relative">
              <ShieldSVG progress={shieldProgress} />
            </div>

            {/* Orbiting dots around shield */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                opacity: shieldProgress > 0.5 ? 0.6 : 0,
                transition: "opacity 1s ease",
              }}
            >
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "hsl(var(--accent))",
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${angle}deg) translateY(-140px)`,
                    animation: `orbitPulse 3s ease-in-out ${angle * 5}ms infinite alternate`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right — Data encryption demo */}
          <div>
            <p
              data-animate
              className="opacity-0 animate-on-scroll text-muted-foreground text-lg leading-relaxed mb-10"
            >
              Every piece of your personal information is encrypted end-to-end.
              We never see it, we never store it in plain text, and we never
              sell it. Watch how your data looks to everyone else:
            </p>

            {/* Data card */}
            <div
              data-animate
              data-trigger-encrypt
              className="opacity-0 animate-on-scroll bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm"
            >
              {/* Card header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--accent) / 0.1)" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    User Profile
                  </p>
                  <p className="text-xs text-muted-foreground">
                    End-to-end encrypted
                  </p>
                </div>
                <div
                  className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "hsl(var(--accent) / 0.08)",
                    color: "hsl(var(--accent))",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "hsl(var(--accent))" }}
                  />
                  Protected
                </div>
              </div>

              {/* Encrypted data rows */}
              {SAMPLE_DATA.map((item, i) => (
                <EncryptedRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  encrypted={item.encrypted}
                  isVisible={isDataVisible}
                  delay={800 + i * 400}
                />
              ))}

              {/* Bottom status bar */}
              <div
                className="mt-6 pt-4 border-t border-border flex items-center gap-2"
                style={{
                  opacity: isDataVisible ? 1 : 0,
                  transition: "opacity 0.8s ease 3.5s",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="hsl(150 60% 45%)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="text-xs text-muted-foreground">
                  All fields encrypted with AES-256 on-chain
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom trust indicators */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              ),
              title: "Credibility",
              desc: "We can never read your data. By design, not by promise.",
            },
            {
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </>
              ),
              title: "Transparency",
              desc: "Every encryption event is logged on-chain for full transparency.",
            },
            {
              icon: (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </>
              ),
              title: "Privacy",
              desc: "Only you hold the keys. Not us, not anyone else.",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              data-animate
              className="opacity-0 animate-on-scroll bg-card border border-border rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-accent/30"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--accent) / 0.06)" }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Inline animation keyframes */}
      <style jsx>{`
        @keyframes orbitPulse {
          0% { opacity: 0.3; transform: rotate(inherit) translateY(-140px) scale(0.8); }
          100% { opacity: 0.8; transform: rotate(inherit) translateY(-140px) scale(1.2); }
        }
      `}</style>
    </section>
  );
}
