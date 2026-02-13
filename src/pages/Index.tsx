import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import InteractiveMap from "@/components/landing/InteractiveMap";
import PasteLinkInput from "@/components/landing/PasteLinkInput";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <PasteLinkInput />
      <InteractiveMap />
      <FeaturesGrid />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
