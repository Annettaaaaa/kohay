import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ExternalLink } from "lucide-react";
import mapBg from "@/assets/apple-map-bg.jpg";
import gym1 from "@/assets/places/gym-1.jpg";
import gym2 from "@/assets/places/gym-2.jpg";
import food1 from "@/assets/places/food-1.jpg";
import food2 from "@/assets/places/food-2.jpg";
import library1 from "@/assets/places/library-1.jpg";
import museum1 from "@/assets/places/museum-1.jpg";

type PlaceCategory = "gym" | "food" | "library" | "museum";

interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  x: number; // percentage position
  y: number;
  images: string[];
  address: string;
  savedFrom: string;
}

const categoryConfig: Record<PlaceCategory, { emoji: string; label: string; color: string }> = {
  gym: { emoji: "💪", label: "Gym & Fitness", color: "bg-pink-100 border-pink-300" },
  food: { emoji: "🍽️", label: "Food & Drinks", color: "bg-orange-100 border-orange-300" },
  library: { emoji: "📚", label: "Library & Study", color: "bg-amber-100 border-amber-300" },
  museum: { emoji: "🎨", label: "Museum & Art", color: "bg-violet-100 border-violet-300" },
};

const places: Place[] = [
  { id: "1", name: "Glow Pilates Studio", category: "gym", x: 22, y: 35, images: [gym1, gym2], address: "12 Rue de Rivoli, Paris", savedFrom: "@pilatesgirl on TikTok" },
  { id: "2", name: "Café Fleur", category: "food", x: 45, y: 25, images: [food1, food2], address: "8 Bd Saint-Germain, Paris", savedFrom: "@parisfoodies on IG" },
  { id: "3", name: "The Cozy Chapter", category: "library", x: 65, y: 55, images: [library1], address: "23 Rue Mouffetard, Paris", savedFrom: "@bookishvibes on TikTok" },
  { id: "4", name: "Musée de l'Art Moderne", category: "museum", x: 38, y: 60, images: [museum1], address: "11 Av. du Président Wilson", savedFrom: "@artwalks on IG" },
  { id: "5", name: "Berry Bliss Bowl", category: "food", x: 75, y: 30, images: [food2, food1], address: "5 Rue des Rosiers, Paris", savedFrom: "@healthyeats on TikTok" },
  { id: "6", name: "Sunset Yoga Loft", category: "gym", x: 55, y: 72, images: [gym2, gym1], address: "30 Rue Cler, Paris", savedFrom: "@yogaflow on IG" },
];

const categories = Object.entries(categoryConfig);

const InteractiveMap = () => {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeFilter, setActiveFilter] = useState<PlaceCategory | "all">("all");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredPlaces = activeFilter === "all"
    ? places
    : places.filter((p) => p.category === activeFilter);

  const handlePinClick = (place: Place) => {
    setSelectedPlace(place);
    setCurrentImageIndex(0);
  };

  return (
    <section className="py-24 bg-background" id="map">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-display">
            Your saved spots
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Tap a pin to see the aesthetic pics & details from your saved reels.
          </p>
        </motion.div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-2 ${
              activeFilter === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-foreground border-border hover:border-foreground/30"
            }`}
          >
            🗺️ All
          </button>
          {categories.map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key as PlaceCategory)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-2 ${
                activeFilter === key
                  ? "bg-foreground text-background border-foreground"
                  : `${config.color} text-foreground hover:scale-105`
              }`}
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>

        {/* Map container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-elevated)] border border-border"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Apple Maps style background */}
          <img
            src={mapBg}
            alt="Map view"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Map overlay for slight warmth */}
          <div className="absolute inset-0 bg-background/10" />

          {/* Pins */}
          <AnimatePresence>
            {filteredPlaces.map((place) => {
              const config = categoryConfig[place.category];
              return (
                <motion.button
                  key={place.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => handlePinClick(place)}
                  className="absolute z-10 group"
                  style={{ left: `${place.x}%`, top: `${place.y}%`, transform: "translate(-50%, -100%)" }}
                >
                  {/* Pin body */}
                  <div className="relative flex flex-col items-center">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                      {place.name}
                    </div>

                    {/* Emoji bubble */}
                    <div
                      className={`h-12 w-12 rounded-full border-[3px] border-background shadow-lg flex items-center justify-center text-xl cursor-pointer
                        hover:scale-110 transition-transform duration-200 ${config.color}`}
                    >
                      {config.emoji}
                    </div>
                    {/* Pin stem */}
                    <div className="w-0.5 h-3 bg-foreground/30 rounded-full" />
                    <div className="w-2 h-2 rounded-full bg-foreground/20" />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>

          {/* Apple Maps style UI elements */}
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md rounded-2xl px-4 py-2 shadow-[var(--shadow-soft)] flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse-soft" />
            <span className="text-xs font-semibold text-foreground">Paris, France</span>
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="bg-background/80 backdrop-blur-md rounded-xl p-2 shadow-[var(--shadow-soft)]">
              <span className="text-sm font-bold text-foreground leading-none block text-center">+</span>
            </div>
            <div className="bg-background/80 backdrop-blur-md rounded-xl p-2 shadow-[var(--shadow-soft)]">
              <span className="text-sm font-bold text-foreground leading-none block text-center">−</span>
            </div>
          </div>

          {/* Selected place popup */}
          <AnimatePresence>
            {selectedPlace && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20"
              >
                <div className="bg-background/95 backdrop-blur-xl rounded-3xl shadow-[var(--shadow-elevated)] overflow-hidden border border-border">
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="absolute top-3 right-3 z-30 h-8 w-8 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center hover:bg-foreground/20 transition-colors"
                  >
                    <X className="h-4 w-4 text-foreground" />
                  </button>

                  {/* Image gallery */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={selectedPlace.images[currentImageIndex]}
                      alt={selectedPlace.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Image dots */}
                    {selectedPlace.images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {selectedPlace.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={`h-2 rounded-full transition-all ${
                              i === currentImageIndex
                                ? "w-6 bg-background"
                                : "w-2 bg-background/50"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${categoryConfig[selectedPlace.category].color} backdrop-blur-sm`}>
                        {categoryConfig[selectedPlace.category].emoji}{" "}
                        {categoryConfig[selectedPlace.category].label}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground font-display">
                        {selectedPlace.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedPlace.address}</p>
                    </div>

                    <p className="text-xs text-muted-foreground/70">
                      Saved from <span className="font-medium text-primary">{selectedPlace.savedFrom}</span>
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Open in Maps
                      </button>
                      <button className="h-10 w-10 rounded-xl border-2 border-border flex items-center justify-center hover:bg-card transition-colors">
                        <Heart className="h-4 w-4 text-soft-coral" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default InteractiveMap;
