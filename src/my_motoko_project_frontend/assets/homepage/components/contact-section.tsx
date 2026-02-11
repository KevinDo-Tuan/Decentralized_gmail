"use client";

import { useEffect, useRef } from "react";

export default function ContactSection() {
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
    <section ref={sectionRef} id="contact" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Info */}
          <div data-animate className="opacity-0 animate-on-scroll">
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-6 leading-tight">
              {"Let's Create Something "}
              <span className="font-semibold">Amazing</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              Wants to collaborate on innovative projects that push the
              boundaries of technology and design.
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Email
                </span>
                <a
                  href="mailto:dophamtuan2008@gmail.com"
                  className="text-foreground text-lg font-medium transition-colors duration-300 hover:text-accent"
                >
                  dophamtuan2008@gmail.com
                </a>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Location
                </span>
                <span className="text-foreground text-lg">Viet Nam</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div
            data-animate
            className="opacity-0 animate-on-scroll"
            style={{ animationDelay: "0.2s" }}
          >
            <form className="bg-card p-8 md:p-10 rounded-2xl border border-border">
              <div className="mb-5">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="w-full px-5 py-4 border border-border rounded-xl bg-background text-foreground text-base transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="mb-5">
                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  className="w-full px-5 py-4 border border-border rounded-xl bg-background text-foreground text-base transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="mb-6">
                <textarea
                  placeholder="Tell us about your project"
                  rows={5}
                  required
                  className="w-full px-5 py-4 border border-border rounded-xl bg-background text-foreground text-base transition-all duration-300 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 resize-y placeholder:text-muted-foreground/60"
                />
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-foreground text-background rounded-full text-base font-medium transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:-translate-y-1 hover:shadow-lg"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
