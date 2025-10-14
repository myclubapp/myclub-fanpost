import { Header } from "@/components/Header";
import { AnimatedHero } from "@/components/landing/AnimatedHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { EmotionalPricing } from "@/components/landing/EmotionalPricing";
import { AboutSection } from "@/components/landing/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <AnimatedHero />

      {/* Pricing Section */}
      <EmotionalPricing />

      {/* How It Works Section */}
      <HowItWorks />

      {/* About Section */}
      <AboutSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
