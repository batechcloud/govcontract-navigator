import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { BackToTop } from "@/components/ui/back-to-top";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>GovAI Search - Find Government Contracts the Easy Way</title>
        <meta name="description" content="Find government contracts for your small business. Search federal and state opportunities in plain English. No experience needed — AI helps you search, bid, and win." />
      </Helmet>
      
      {/* Skip to content link for accessibility */}
      <a href="#hero" className="skip-link">
        Skip to main content
      </a>
      
      <div className="min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <section id="trusted">
            <TrustedBySection />
          </section>
          <section id="features">
            <FeaturesSection />
          </section>
          <ComparisonSection />
          <section id="testimonials">
            <TestimonialsSection />
          </section>
          <section id="pricing">
            <PricingSection />
          </section>
          <CTASection />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </>
  );
};

export default Index;
