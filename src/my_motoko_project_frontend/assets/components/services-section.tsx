"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ImageIcon, BarChart3, ArrowRight } from "lucide-react";
import { loginAndGetUser } from "@/lib/internet-identity";
import { toast } from '@/hooks/use-toast'




type Service = {
  icon: typeof MessageSquare;
  title: string;
  description: string;
  link: string;
  requiresInternetIdentity?: boolean;
};

const SERVICES: Service[] = [
  {
    icon: MessageSquare,
    title: "Tuamail",
    description:
      "100% on-chain. Have the rights over your email with full encryption and ownership.",
    link: "/tuamail",
    requiresInternetIdentity: true,
  },
  {
    icon: ImageIcon,
    title: "Tuamsdia",
    description:
      "100% on-chain. Decide what you want to post and have full control over your content.",
    link: "#",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Unlock insights from your data to make informed decisions and optimize performance.",
    link: "#",
  },
];

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const [pendingService, setPendingService] = useState<string | null>(null);

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

  const handleTryIt = async (service: Service) => {
    if (!service.requiresInternetIdentity || service.link === "#") {
      toast({
            title: "Coming Soon",
            description: "Our team is working on this. Stay tuned",
          });
      return;
    }

    if (service.title === pendingService) {
      return;
    }

    setPendingService(service.title);

    try {
      const { principal, user, isNewUser } = await loginAndGetUser();

      window.localStorage.setItem(
        "tuamail_login_context",
        JSON.stringify({
          principal,
          role: user.role,
          isNewUser,
        })
      );

      router.push("/tuamail");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed. Please try again.";
      window.alert(message);
    } finally {
      setPendingService(null);
    }
  };

  return (
    
    <section ref={sectionRef} id="services" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div
            data-animate
            className="opacity-0 animate-on-scroll inline-block px-5 py-2 bg-card border border-border rounded-full text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6"
          >
            What We Do
          </div>
          <h2
            data-animate
            className="opacity-0 animate-on-scroll font-serif text-4xl md:text-5xl lg:text-6xl font-light text-foreground"
          >
            Services built for
            <br />
            <span className="font-semibold">benefits of Users</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map((service, index) => (
            <div
              key={service.title}
              data-animate
              className="opacity-0 animate-on-scroll group bg-card p-8 md:p-10 rounded-2xl border border-border transition-all duration-400 cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-accent"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--accent)) 0%, #ee5a6f 100%)",
                }}
              >
                <service.icon className="w-7 h-7 text-accent-foreground" />
              </div>

              <h3 className="font-serif text-2xl font-semibold text-foreground mb-3">
                {service.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed mb-6">{service.description}</p>

              <button
                type="button"
                onClick={() => void handleTryIt(service)}
                disabled={pendingService === service.title}
                className="inline-flex items-center gap-2 text-accent font-medium text-sm transition-all duration-300 hover:gap-3 disabled:opacity-60"
              >
                {pendingService === service.title ? "Logging in..." : "Try it"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
    
  );
}
