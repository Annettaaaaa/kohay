import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import MapPreviewSection from "@/components/landing/MapPreviewSection";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <MapPreviewSection />
      <FeaturesGrid />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
