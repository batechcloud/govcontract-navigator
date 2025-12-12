import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { TrustedBySection } from "@/components/landing/TrustedBySection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>GovAI Search - AI-Powered Government Contract Discovery</title>
        <meta name="description" content="Win government contracts with AI. Search, understand, and bid on federal, state, and grant opportunities. GovAI finds perfect contracts and generates winning proposals." />
      </Helmet>
      
      {/* Skip to content link for accessibility */}
      <a href="#hero" className="skip-link">
        Skip to main content
      </a>
      
      <div className="min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <TrustedBySection />
          <FeaturesSection />
          <TestimonialsSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
