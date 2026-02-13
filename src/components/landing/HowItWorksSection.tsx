import { motion } from "framer-motion";
import { Link2, MapPin, Route, Bell, Smartphone, Share2 } from "lucide-react";

const steps = [
  {
    icon: Link2,
    title: "Paste a Link",
    description: "Share any TikTok or Instagram reel to Kohay. We handle the rest.",
    stamp: "POSTED",
    stampColor: "text-primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/5",
    accentBg: "bg-primary/10",
    accentText: "text-primary",
    denomination: "01",
  },
  {
    icon: MapPin,
    title: "Auto-Extract",
    description: "AI identifies the place, restaurant, or landmark from the video.",
    stamp: "LOCATED",
    stampColor: "text-accent",
    borderColor: "border-accent/30",
    bgColor: "bg-accent/5",
    accentBg: "bg-accent/10",
    accentText: "text-accent",
    denomination: "02",
  },
  {
    icon: Route,
    title: "Plan Route",
    description: "AI builds the perfect itinerary based on your saves and interests.",
    stamp: "ROUTED",
    stampColor: "text-warm-gold",
    borderColor: "border-warm-gold/30",
    bgColor: "bg-warm-gold/5",
    accentBg: "bg-warm-gold/10",
    accentText: "text-warm-gold",
    denomination: "03",
  },
  {
    icon: Bell,
    title: "Get Nudged",
    description: "We remind you when you're near saved spots. Go explore!",
    stamp: "DELIVERED",
    stampColor: "text-soft-coral",
    borderColor: "border-soft-coral/30",
    bgColor: "bg-soft-coral/5",
    accentBg: "bg-soft-coral/10",
    accentText: "text-soft-coral",
    denomination: "04",
  },
];

const mobileFeatures = [
  {
    icon: Share2,
    title: "Share Sheet",
    description: "Tap Share → Kohay on any reel",
  },
  {
    icon: Smartphone,
    title: "Offline Maps",
    description: "Access saved spots without WiFi",
  },
];

const StampEdge = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 8" preserveAspectRatio="none" fill="currentColor">
    {Array.from({ length: 25 }).map((_, i) => (
      <circle key={i} cx={4 + i * 8} cy="4" r="3" />
    ))}
  </svg>
);

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-soft-peach/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-5">
            ✈️ How It Works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            From doomscrolling to <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-[var(--gradient-hero)]">doorstepping</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Four simple steps. Like collecting stamps for your passport.
          </p>
        </motion.div>

        {/* Stamp cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30, rotate: index % 2 === 0 ? -2 : 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -1 : 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              whileHover={{ rotate: 0, scale: 1.04, y: -8 }}
              className="relative group cursor-pointer"
            >
              {/* Stamp perforated edge effect */}
              <div className={`relative rounded-sm overflow-hidden ${step.bgColor} border-2 ${step.borderColor} p-1`}>
                {/* Inner stamp border */}
                <div className="border border-dashed border-foreground/10 rounded-sm p-6 relative">
                  {/* Denomination */}
                  <div className={`absolute top-3 right-3 text-2xl font-black ${step.accentText} opacity-20 font-display`}>
                    {step.denomination}
                  </div>

                  {/* Stamp cancel mark */}
                  <div className={`absolute -top-1 -right-1 ${step.stampColor} opacity-10 text-[40px] font-black rotate-[-15deg] pointer-events-none select-none`}>
                    ●
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${step.accentBg} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className={`h-6 w-6 ${step.accentText}`} />
                  </div>

                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>

                  {/* Stamp text */}
                  <div className={`mt-4 inline-block px-3 py-1 rounded-full border ${step.borderColor} ${step.stampColor} text-[10px] font-black uppercase tracking-[0.2em] rotate-[-3deg]`}>
                    {step.stamp}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile-first features bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {mobileFeatures.map((feat) => (
            <div
              key={feat.title}
              className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-[var(--shadow-soft)] border border-border"
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <feat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{feat.title}</p>
                <p className="text-xs text-muted-foreground">{feat.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
