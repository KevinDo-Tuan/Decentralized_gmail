"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { number: 2, suffix: "+", label: "Projects Delivered" },
  { number: 98, suffix: "%", label: "Client Satisfaction" },
  { number: 10, suffix: "+", label: "Years Experience" },
  { number: 1, suffix: "", label: "Team Members" },
];

function AnimatedNumber({
  target,
  suffix,
  inView,
}: {
  target: number;
  suffix: string;
  inView: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);
      setValue(start);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);

  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-2">
                <AnimatedNumber
                  target={stat.number}
                  suffix={stat.suffix}
                  inView={inView}
                />
              </div>
              <div className="text-muted-foreground text-sm uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
