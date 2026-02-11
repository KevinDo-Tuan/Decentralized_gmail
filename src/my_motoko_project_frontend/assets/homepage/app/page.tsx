"use client";

import { useState } from "react";
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

export default function Page() {
  const [introComplete, setIntroComplete] = useState(false);
  const [showHome, setShowHome] = useState(false);

  const handleIntroComplete = () => {
    setShowHome(true);
    setTimeout(() => {
      setIntroComplete(true);
    }, 1300);
  };

  return (
    <>
      {!introComplete && <IntroSplash onComplete={handleIntroComplete} />}
      
      <div
        className={`transition-opacity duration-700 ${
          showHome ? "opacity-100" : "opacity-0"
        }`}
      >
        <Navbar />
        <main>
          <HeroSection />
          <PrivacySection />
          <StatsSection />
          <ServicesSection />
          <WorkSection />
          <TestimonialsSection />
          <ContactSection />
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
