import { Header } from "@/components/Header";
import { AnimatedHero } from "@/components/landing/AnimatedHero";
import { FeatureTimeline } from "@/components/landing/FeatureTimeline";
import { EmotionStrip } from "@/components/landing/EmotionStrip";
import { EmotionalPricing } from "@/components/landing/EmotionalPricing";
import { MissionSection } from "@/components/landing/MissionSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero with Animated Instagram Feed */}
      <AnimatedHero />

      {/* Feature Timeline - How it works */}
      <FeatureTimeline />

      {/* Emotion Strip - Scrolling Example Posts 
      <EmotionStrip />*/}

      {/* Pricing Section */}
      <EmotionalPricing />

      {/* Mission & About Section 
      <MissionSection />*/}
      
      {/* Final CTA 
      <FinalCTA />*/}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
