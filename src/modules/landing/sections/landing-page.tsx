import { NavbarSection } from "./sections/navbar-section";
import { HeroSection } from "./sections/hero-section";
import { StatsSection } from "./sections/stats-section";
import { FeaturesSection } from "./sections/features-section";
import { WorkflowSection } from "./sections/workflow-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { CtaSection } from "./sections/cta-section";
import { FooterSection } from "./sections/footer-section";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavbarSection />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <WorkflowSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  );
}

export default LandingPage;
