"use client";

import { useEffect, useRef } from "react";
import { Quote } from "lucide-react";

export default function TestimonialsSection() {
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
      { threshold: 0.2 }
    );
    const elements = sectionRef.current?.querySelectorAll("[data-animate]");
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-24 md:py-32 bg-foreground"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <Quote
          data-animate
          className="opacity-0 animate-on-scroll w-12 h-12 mx-auto mb-8"
          style={{ color: "hsl(var(--accent))" }}
        />

        <blockquote
          data-animate
          className="opacity-0 animate-on-scroll font-serif text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed mb-10"
          style={{
            color: "hsl(var(--background))",
            fontStyle: "italic",
          }}
        >
          &ldquo;Tuams transformed our digital presence completely. Not only
          on UI side but also backend. They completely redefine what is called: "Your privacy is our priority."&rdquo;
        </blockquote>

        <div data-animate className="opacity-0 animate-on-scroll">
          <h4
            className="text-lg font-semibold mb-1"
            style={{ color: "hsl(var(--background))" }}
          >
            Someone
          </h4>
          <p
            className="text-sm"
            style={{ color: "hsl(var(--background) / 0.6)" }}
          >
            CEO, TechVenture
          </p>
        </div>
      </div>
    </section>
  );
}
