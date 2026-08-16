import { LandingHeader } from "./components/landing-header";
import { LandingFooter } from "./components/landing-footer";

import { HeroSection } from "./sections/hero-section";
import { AboutSection } from "./sections/about-section";
import { ServicesSection } from "./sections/services-section";
import { FaqSection } from "./sections/faq-section";
import { ContactSection } from "./sections/contact-section";

export function LandingPage() {
  return (
    <>
      <LandingHeader />

      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <FaqSection />
        <ContactSection />
      </main>

      <LandingFooter />
    </>
  );
}