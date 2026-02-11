import { motion } from "framer-motion";
import { MapPin, Users, Camera } from "lucide-react";
import mapPreview from "@/assets/map-preview.jpg";

const MapPreviewSection = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Map visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-[var(--shadow-elevated)]">
              <img
                src={mapPreview}
                alt="Interactive map showing saved travel locations across Europe"
                className="w-full h-auto"
              />
            </div>

            {/* Floating pins */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-12 right-8 bg-background rounded-xl p-3 shadow-[var(--shadow-card)] flex items-center gap-2"
            >
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">12 photos nearby</span>
            </motion.div>

            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-12 left-8 bg-background rounded-xl p-3 shadow-[var(--shadow-card)] flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-foreground">3 friends exploring</span>
            </motion.div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Your world,{" "}
              <span className="bg-clip-text text-transparent bg-[var(--gradient-hero)]">
                pinned
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              Every saved reel becomes a pin on your personal map. See friends exploring nearby, upload your own aesthetic shots, and discover hidden gems from the community.
            </p>

            <div className="space-y-5">
              {[
                { icon: MapPin, label: "Auto-sorted by location & category" },
                { icon: Users, label: "See friends on the map — like Waze, but for travel" },
                { icon: Camera, label: "Upload your aesthetic pics for others to discover" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MapPreviewSection;
