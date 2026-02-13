import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-travel.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-[var(--gradient-warm)]" />

      <div className="container relative z-10 mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8">

            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Your saved reels, mapped & planned
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] text-foreground tracking-tight">
              Turn saved <br />
              <span className="bg-clip-text text-transparent bg-[var(--gradient-hero)]">
                reels
              </span>{" "}
              into <br />
              real trips
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Paste a TikTok or Instagram link. Kohay extracts the location, maps it, and helps you plan the perfect trip — powered by AI.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="px-8 py-6">
                <MapPin className="h-5 w-5" />
                Start Mapping
              </Button>
              <Button variant="hero-outline" size="lg" className="px-8 py-6">
                See How It Works
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) =>
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">

                    {String.fromCharCode(64 + i)}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">2,400+</span> travelers already mapping
              </p>
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative hidden lg:block">

            <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-elevated)]">
              




              {/* Floating card */}
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-8 left-8 bg-background/90 backdrop-blur-md rounded-2xl p-4 shadow-[var(--shadow-card)]">

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">3 new spots saved</p>
                    <p className="text-xs text-muted-foreground">Paris, France</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

};

export default HeroSection;