import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-[var(--gradient-hero)] p-12 md:p-20 text-center"
        >
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight font-display">
              Stop saving. Start going.
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-md mx-auto">
              Join thousands of travelers turning their saved reels into unforgettable adventures.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full px-8 py-6 text-base font-semibold shadow-[var(--shadow-elevated)]"
              >
                Get Early Access
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full translate-x-1/3 translate-y-1/3" />
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
