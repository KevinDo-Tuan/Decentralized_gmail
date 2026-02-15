"use client";

import { useState, useEffect } from "react";
import IntroSplash from "@/components/intro-splash";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/hero-section";
import PrivacySection from "@/components/privacy-section";
import StatsSection from "@/components/stats-section";
import ServicesSection from "@/components/services-section";
import WorkSection from "@/components/work-section";
import TestimonialsSection from "@/components/testimonials-section";
import ContactSection from "@/components/contact-section";
import SiteFooter from "@/components/site-footer";

// Wrapper for staggered entrance animation
function StaggeredSection({
  children,
  show,
  delay,
}: {
  children: React.ReactNode;
  show: boolean;
  delay: number;
}) {
  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show
          ? "translateY(0) scale(1)"
          : "translateY(40px) scale(0.98)",
        transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, 
                     transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Page() {
  const [introComplete, setIntroComplete] = useState(
    true);
  const [showHome, setShowHome] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("seenIntro");

    if (!hasSeenIntro) {
      // First time this session → show splash
      setIntroComplete(false);
    } else {
      // Already seen → skip splash
      setShowHome(true);
    }
  }, []);

  const handleIntroComplete = () => {
    // Mark intro as seen for this session
    sessionStorage.setItem("seenIntro", "true");

    setShowHome(true);

    // Keep intro mounted during fade-out, then unmount
    setTimeout(() => {
      setIntroComplete(true);
    }, 3600);
  };

  return (
    <>
      {!introComplete && (
        <IntroSplash onComplete={handleIntroComplete} />
      )}

      <div>
        {/* Navbar */}
        <div
          style={{
            opacity: showHome ? 1 : 0,
            transform: showHome
              ? "translateY(0)"
              : "translateY(-100%)",
            transition:
              "opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s",
          }}
        >
          <Navbar />
        </div>

        <main>
          <StaggeredSection show={showHome} delay={0.4}>
            <HeroSection enterReady={showHome} />
          </StaggeredSection>

          <StaggeredSection show={showHome} delay={0.8}>
            <PrivacySection />
          </StaggeredSection>

          <StaggeredSection show={showHome} delay={0.95}>
            <StatsSection />
          </StaggeredSection>

          <StaggeredSection show={showHome} delay={1.1}>
            <ServicesSection />
          </StaggeredSection>

          <StaggeredSection show={showHome} delay={1.25}>
            <WorkSection />
          </StaggeredSection>

          <StaggeredSection show={showHome} delay={1.4}>
            <TestimonialsSection />
          </StaggeredSection>

          <StaggeredSection show={showHome} delay={1.55}>
            <ContactSection />
          </StaggeredSection>
        </main>

        <StaggeredSection show={showHome} delay={1.7}>
          <SiteFooter />
        </StaggeredSection>
      </div>
    </>
  );
}
