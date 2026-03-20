import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getSavedPlaces, SavedPlace } from "@/lib/api/places";

// Fix default marker icons broken by Webpack/Vite asset pipeline
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type PlaceCategory = "gym" | "food" | "library" | "museum" | "cafe" | "park" | "shopping" | "nightlife" | "hotel" | "beach" | "other";

const categoryConfig: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  gym:       { emoji: "💪", label: "Gym & Fitness",    color: "bg-pink-100 border-pink-300",     bg: "#fce7f3" },
  food:      { emoji: "🍽️", label: "Food & Drinks",    color: "bg-orange-100 border-orange-300", bg: "#fed7aa" },
  cafe:      { emoji: "☕", label: "Café",             color: "bg-amber-100 border-amber-300",   bg: "#fde68a" },
  library:   { emoji: "📚", label: "Library & Study",  color: "bg-amber-100 border-amber-300",   bg: "#fde68a" },
  museum:    { emoji: "🎨", label: "Museum & Art",     color: "bg-violet-100 border-violet-300", bg: "#ede9fe" },
  park:      { emoji: "🌿", label: "Park & Nature",    color: "bg-green-100 border-green-300",   bg: "#d1fae5" },
  shopping:  { emoji: "🛍️", label: "Shopping",         color: "bg-blue-100 border-blue-300",     bg: "#dbeafe" },
  nightlife: { emoji: "🎵", label: "Nightlife",        color: "bg-purple-100 border-purple-300", bg: "#f3e8ff" },
  hotel:     { emoji: "🏨", label: "Hotel & Stay",     color: "bg-sky-100 border-sky-300",       bg: "#e0f2fe" },
  beach:     { emoji: "🏖️", label: "Beach",            color: "bg-cyan-100 border-cyan-300",     bg: "#cffafe" },
  other:     { emoji: "📍", label: "Other",            color: "bg-gray-100 border-gray-300",     bg: "#f3f4f6" },
};

function makePinIcon(emoji: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
        <div style="
          width:44px;height:44px;border-radius:50%;
          border:3px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
          font-size:22px;background:white;
          transition:transform 0.15s;
        ">${emoji}</div>
        <div style="width:2px;height:10px;background:rgba(0,0,0,0.25);border-radius:1px;margin-top:1px"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:rgba(0,0,0,0.15)"></div>
      </div>
    `,
    iconSize: [44, 60],
    iconAnchor: [22, 60],
    popupAnchor: [0, -60],
  });
}

// Fly to bounds when places change
function FlyToBounds({ places }: { places: SavedPlace[] }) {
  const map = useMap();
  useEffect(() => {
    const withCoords = places.filter((p) => p.latitude != null && p.longitude != null);
    if (withCoords.length === 0) return;
    if (withCoords.length === 1) {
      map.flyTo([withCoords[0].latitude!, withCoords[0].longitude!], 13, { duration: 1.2 });
    } else {
      const bounds = L.latLngBounds(withCoords.map((p) => [p.latitude!, p.longitude!]));
      map.flyToBounds(bounds, { padding: [60, 60], duration: 1.2 });
    }
  }, [places, map]);
  return null;
}

const SHOW_CATEGORIES = ["all", "gym", "food", "cafe", "library", "museum", "park", "shopping", "nightlife", "hotel", "beach", "other"];

const InteractiveMap = () => {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedPlaces()
      .then(setPlaces)
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch when a new place is saved (custom event)
  useEffect(() => {
    const handler = () => {
      getSavedPlaces().then(setPlaces).catch(() => {});
    };
    window.addEventListener("kohay:places-updated", handler);
    return () => window.removeEventListener("kohay:places-updated", handler);
  }, []);

  const filteredPlaces = activeFilter === "all"
    ? places
    : places.filter((p) => p.category === activeFilter);

  const placeCategories = [...new Set(places.map((p) => p.category))];

  const usedCategories = SHOW_CATEGORIES.filter(
    (c) => c === "all" || placeCategories.includes(c)
  );

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
            Every place you extract from TikTok & Instagram — pinned to a real world map.
          </p>
        </motion.div>

        {/* Category filters — only show categories that exist in saved places */}
        {usedCategories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {usedCategories.map((key) => {
              const config = key === "all" ? { emoji: "🗺️", label: "All" } : categoryConfig[key];
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-2 ${
                    isActive
                      ? "bg-foreground text-background border-foreground"
                      : key === "all"
                        ? "bg-card text-foreground border-border hover:border-foreground/30"
                        : `${categoryConfig[key]?.color || ""} text-foreground hover:scale-105`
                  }`}
                >
                  {config.emoji} {config.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Map container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-elevated)] border border-border"
          style={{ height: "520px" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full bg-muted/30">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <MapPin className="h-8 w-8 animate-pulse" />
                <p className="text-sm font-medium">Loading your map…</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={[20, 10]}
              zoom={2}
              minZoom={2}
              maxZoom={18}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
              scrollWheelZoom={true}
              worldCopyJump={true}
            >
              {/* Carto Voyager tiles — clean, Apple Maps-like aesthetic */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />

              {filteredPlaces
                .filter((p) => p.latitude != null && p.longitude != null)
                .map((place) => {
                  const cat = categoryConfig[place.category] || categoryConfig.other;
                  return (
                    <Marker
                      key={place.id}
                      position={[place.latitude!, place.longitude!]}
                      icon={makePinIcon(cat.emoji)}
                      eventHandlers={{ click: () => setSelectedPlace(place) }}
                    />
                  );
                })}

              <FlyToBounds places={filteredPlaces} />
            </MapContainer>
          )}

          {/* Empty state overlay */}
          {!loading && places.length === 0 && (
            <div className="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none z-[1000]">
              <div className="bg-background/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-border text-center max-w-xs">
                <p className="text-sm font-semibold text-foreground mb-1">No places saved yet</p>
                <p className="text-xs text-muted-foreground">
                  Paste a TikTok or Instagram link above to extract and save places to your map.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Selected place card — shown below the map */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="mt-4 relative bg-card border border-border rounded-3xl shadow-[var(--shadow-elevated)] overflow-hidden"
            >
              <div className="p-5">
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-4 pr-10">
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 border-2"
                    style={{ background: categoryConfig[selectedPlace.category]?.bg || "#f3f4f6" }}
                  >
                    {categoryConfig[selectedPlace.category]?.emoji || "📍"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground font-display leading-tight">
                      {selectedPlace.place_name}
                    </h3>
                    {selectedPlace.address && (
                      <p className="text-sm text-muted-foreground mt-0.5">{selectedPlace.address}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                          categoryConfig[selectedPlace.category]?.color || "bg-gray-100 border-gray-300"
                        }`}
                      >
                        {categoryConfig[selectedPlace.category]?.emoji} {categoryConfig[selectedPlace.category]?.label || selectedPlace.category}
                      </span>
                      {selectedPlace.platform && (
                        <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium capitalize">
                          {selectedPlace.platform}
                        </span>
                      )}
                    </div>
                    {selectedPlace.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {selectedPlace.description}
                      </p>
                    )}
                    {selectedPlace.source_username && (
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        Saved from{" "}
                        <span className="font-medium text-primary">@{selectedPlace.source_username}</span>
                      </p>
                    )}
                  </div>
                </div>

                {selectedPlace.latitude && selectedPlace.longitude && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <a
                      href={`https://maps.google.com/?q=${selectedPlace.latitude},${selectedPlace.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default InteractiveMap;
