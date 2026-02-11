import { motion } from "framer-motion";
import { Brain, Calendar, Utensils, Compass, Share2, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Trip Planner",
    description: "Smart itineraries based on your saved spots, budget, and travel style.",
  },
  {
    icon: Calendar,
    title: "Smart Nudges",
    description: "Get notified when you're free and there are cool spots nearby to explore.",
  },
  {
    icon: Utensils,
    title: "Easy Bookings",
    description: "Book restaurants and events directly from your saved collection.",
  },
  {
    icon: Compass,
    title: "Optimal Routes",
    description: "AI-optimized routes so you hit every spot without wasting time.",
  },
  {
    icon: Share2,
    title: "Social Discovery",
    description: "See what your friends are saving and share your own hidden gems.",
  },
  {
    icon: Zap,
    title: "Instant Extraction",
    description: "Paste a link and we extract the location in seconds. No manual tagging.",
  },
];

const FeaturesGrid = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything you need
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From saving a reel to stepping through the door — Kohay covers every step.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-card rounded-2xl p-8 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
