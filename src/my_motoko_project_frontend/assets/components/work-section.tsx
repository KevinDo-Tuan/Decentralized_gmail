"use client";

import { useEffect, useRef } from "react";

const PROJECTS = [
  {
    title: "Drone Book",
    description:
      "A book that teaches users how to build drones in the fastest fashion.",
    tags: ["Author", "Arduino", "Python", "C++"],  
    gradient: "linear-gradient(135deg, #f7f7f7 0%, #f6f4f7 100%)",
    image: "/book.jpeg",
    large: true,
  },
  {
    title: "AI-Powered SAT Platform",
    description:
      "An AI-powered platform that helps students prepare for the SAT exam with personalized learning paths.",
    tags: ["Python", "HTML", "TS", "Java"],
    gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 100%)",
    image: "/sat.jpeg",
    large: false,
  },
  {
    title: "Water Complaint System in Vietnamese",
    description:
      "A system for reporting and tracking water-related complaints in apartments by Vietnamese, for Vietnamese.",
    tags: ["HTML", "CSS", "Java", "Motoko"],
    gradient: "linear-gradient(135deg, #f2f3f5 0%, #ffffff 100%)",
    image: "/complaint.jpeg",
    large: false,
  },
];

export default function WorkSection() {
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
    <section ref={sectionRef} id="work" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div
            data-animate
            className="opacity-0 animate-on-scroll inline-block px-5 py-2 bg-background border border-border rounded-full text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6"
          >
            Case Studies
          </div>
          <h2
            data-animate
            className="opacity-0 animate-on-scroll font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground"
          >
            Featured <span className="font-semibold">Work</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PROJECTS.map((project, index) => (
            <div
              key={project.title}
              data-animate
              className={`opacity-0 animate-on-scroll group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-400 hover:shadow-2xl ${
                project.large ? "md:row-span-2" : ""
              }`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div
              className="w-full h-40 transition-transform duration-500 group-hover:scale-105 bg-center bg-no-repeat"
              style={{
              backgroundImage: project.image
                ? `url(${project.image}), ${project.gradient}`
                : project.gradient,
              backgroundSize: "contain, cover",
              backgroundPosition: "center, center",
              backgroundRepeat: "no-repeat, no-repeat",
              minHeight: project.large ? "100%" : "320px",
              height: project.large ? "50%" : "100px",
            }}

            />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-card transition-transform duration-400 translate-y-8 group-hover:translate-y-0"
                style={{
                  background: "linear-gradient(to top, hsl(348, 100%, 60%), transparent)",
                  color: "white",
                }}
              >
                <h3 className="font-serif text-2xl md:text-3xl font-semibold mb-2">
                  {project.title}
                </h3>
                <p className="text-sm opacity-80 mb-4 max-w-md leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs backdrop-blur-sm"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
