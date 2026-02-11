import { motion } from "framer-motion";
import { Link2, MapPin, Route, Bell } from "lucide-react";

const steps = [
  {
    icon: Link2,
    title: "Paste a Link",
    description: "Share any TikTok or Instagram reel to Kohay. We handle the rest.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MapPin,
    title: "Auto-Extract Location",
    description: "Our AI identifies the place, restaurant, or landmark from the video.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Route,
    title: "Plan Your Route",
    description: "AI builds the perfect itinerary based on your saves and interests.",
    color: "bg-warm-gold/10 text-warm-gold",
  },
  {
    icon: Bell,
    title: "Get Nudged",
    description: "We'll remind you when you're free and near saved spots. Go explore!",
    color: "bg-soft-coral/10 text-soft-coral",
  },
];

const HowItWorksSection = () => {
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
            How Kohay Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From doomscrolling to doorstepping — in four simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative group"
            >
              <div className="bg-card rounded-2xl p-8 h-full shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-shadow duration-300">
                <div className="mb-6">
                  <span className="text-sm font-bold text-muted-foreground/40">
                    0{index + 1}
                  </span>
                </div>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${step.color} mb-5`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
