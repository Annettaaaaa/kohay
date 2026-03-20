import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, MapPin, Layers, Satellite } from "lucide-react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from "react-map-gl/mapbox";
import type { LngLatBoundsLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getSavedPlaces, SavedPlace } from "@/lib/api/places";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

type StyleId = "standard" | "satellite";
const STYLES: Record<StyleId, string> = {
  standard:  "mapbox://styles/mapbox/standard",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

const categoryConfig: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  gym:       { emoji: "💪", label: "Gym & Fitness",   color: "bg-pink-100 border-pink-300",     bg: "#fce7f3" },
  food:      { emoji: "🍽️", label: "Food & Drinks",   color: "bg-orange-100 border-orange-300", bg: "#fed7aa" },
  cafe:      { emoji: "☕", label: "Café",            color: "bg-amber-100 border-amber-300",   bg: "#fde68a" },
  library:   { emoji: "📚", label: "Library & Study", color: "bg-amber-100 border-amber-300",   bg: "#fde68a" },
  museum:    { emoji: "🎨", label: "Museum & Art",    color: "bg-violet-100 border-violet-300", bg: "#ede9fe" },
  park:      { emoji: "🌿", label: "Park & Nature",   color: "bg-green-100 border-green-300",   bg: "#d1fae5" },
  shopping:  { emoji: "🛍️", label: "Shopping",        color: "bg-blue-100 border-blue-300",     bg: "#dbeafe" },
  nightlife: { emoji: "🎵", label: "Nightlife",       color: "bg-purple-100 border-purple-300", bg: "#f3e8ff" },
  hotel:     { emoji: "🏨", label: "Hotel & Stay",    color: "bg-sky-100 border-sky-300",       bg: "#e0f2fe" },
  beach:     { emoji: "🏖️", label: "Beach",           color: "bg-cyan-100 border-cyan-300",     bg: "#cffafe" },
  other:     { emoji: "📍", label: "Other",           color: "bg-gray-100 border-gray-300",     bg: "#f3f4f6" },
};

const SHOW_CATEGORIES = ["all", "gym", "food", "cafe", "library", "museum", "park", "shopping", "nightlife", "hotel", "beach", "other"];

const InteractiveMap = () => {
  const mapRef = useRef<MapRef>(null);
  const [places, setPlaces]             = useState<SavedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading]           = useState(true);
  const [mapStyle, setMapStyle]         = useState<StyleId>("standard");
  const [popupPlace, setPopupPlace]     = useState<SavedPlace | null>(null);

  const fetchPlaces = useCallback(() => {
    getSavedPlaces().then(setPlaces).catch(() => setPlaces([]));
  }, []);

  useEffect(() => {
    getSavedPlaces()
      .then(setPlaces)
      .catch(() => setPlaces([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener("kohay:places-updated", fetchPlaces);
    return () => window.removeEventListener("kohay:places-updated", fetchPlaces);
  }, [fetchPlaces]);

  const filteredPlaces = activeFilter === "all"
    ? places
    : places.filter((p) => p.category === activeFilter);

  const withCoords = filteredPlaces.filter((p) => p.latitude != null && p.longitude != null);

  // Fly to fit all visible places when list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || withCoords.length === 0) return;

    if (withCoords.length === 1) {
      map.flyTo({ center: [withCoords[0].longitude!, withCoords[0].latitude!], zoom: 11, duration: 1400, essential: true });
    } else {
      const lngs = withCoords.map((p) => p.longitude!);
      const lats = withCoords.map((p) => p.latitude!);
      const bounds: LngLatBoundsLike = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      map.fitBounds(bounds, { padding: 80, duration: 1400, maxZoom: 12 });
    }
  }, [filteredPlaces]);

  const placeCategories = [...new Set(places.map((p) => p.category))];
  const usedCategories  = SHOW_CATEGORIES.filter((c) => c === "all" || placeCategories.includes(c));

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.startsWith("pk.YOUR")) {
    return (
      <section className="py-24 bg-background" id="map">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">
            Add <code className="bg-muted px-1 rounded">VITE_MAPBOX_TOKEN</code> to your{" "}
            <code className="bg-muted px-1 rounded">.env</code> file to enable the map.{" "}
            Get a free token at{" "}
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>.
          </p>
        </div>
      </section>
    );
  }

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

        {/* Category filters */}
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

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-elevated)] border border-border"
          style={{ height: 540 }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full bg-muted/30">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <MapPin className="h-8 w-8 animate-pulse" />
                <p className="text-sm font-medium">Loading your map…</p>
              </div>
            </div>
          ) : (
            <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle={STYLES[mapStyle]}
              initialViewState={{ longitude: 10, latitude: 20, zoom: 1.8 }}
              projection={{ name: "globe" }}
              style={{ width: "100%", height: "100%" }}
              onClick={() => { setPopupPlace(null); setSelectedPlace(null); }}
            >
              <NavigationControl position="top-left" showCompass={false} />

              {withCoords.map((place) => {
                const cat = categoryConfig[place.category] || categoryConfig.other;
                return (
                  <Marker
                    key={place.id}
                    longitude={place.longitude!}
                    latitude={place.latitude!}
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setPopupPlace(place);
                      setSelectedPlace(place);
                    }}
                  >
                    <div
                      className="flex flex-col items-center cursor-pointer group"
                      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-[22px] border-[3px] border-white group-hover:scale-110 transition-transform"
                        style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                      >
                        {cat.emoji}
                      </div>
                      <div className="w-0.5 h-2.5 bg-white/70 rounded" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    </div>
                  </Marker>
                );
              })}

              {popupPlace && popupPlace.latitude && popupPlace.longitude && (
                <Popup
                  longitude={popupPlace.longitude}
                  latitude={popupPlace.latitude}
                  anchor="bottom"
                  offset={64}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setPopupPlace(null)}
                  className="mapbox-popup-clean"
                >
                  <div className="px-3 py-2 min-w-[160px] max-w-[240px]">
                    <p className="font-bold text-foreground text-sm leading-tight">{popupPlace.place_name}</p>
                    {popupPlace.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{popupPlace.address}</p>
                    )}
                  </div>
                </Popup>
              )}
            </Map>
          )}

          {/* Style toggle — top right */}
          {!loading && (
            <div className="absolute top-3 right-3 z-10 flex gap-1.5 bg-background/80 backdrop-blur-md rounded-xl p-1 border border-border shadow-sm">
              <button
                onClick={() => setMapStyle("standard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mapStyle === "standard" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Map
              </button>
              <button
                onClick={() => setMapStyle("satellite")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mapStyle === "satellite" ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                }`}
              >
                <Satellite className="h-3.5 w-3.5" />
                Satellite
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && places.length === 0 && (
            <div className="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none z-10">
              <div className="bg-background/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-border text-center max-w-xs">
                <p className="text-sm font-semibold text-foreground mb-1">No places saved yet</p>
                <p className="text-xs text-muted-foreground">
                  Paste a TikTok or Instagram link above to extract and save places to your map.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Selected place detail card */}
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
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${categoryConfig[selectedPlace.category]?.color || "bg-gray-100 border-gray-300"}`}>
                        {categoryConfig[selectedPlace.category]?.emoji} {categoryConfig[selectedPlace.category]?.label || selectedPlace.category}
                      </span>
                      {selectedPlace.platform && (
                        <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium capitalize">
                          {selectedPlace.platform}
                        </span>
                      )}
                    </div>
                    {selectedPlace.description && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedPlace.description}</p>
                    )}
                    {selectedPlace.source_username && (
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        Saved from <span className="font-medium text-primary">@{selectedPlace.source_username}</span>
                      </p>
                    )}
                  </div>
                </div>

                {selectedPlace.latitude && selectedPlace.longitude && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <a
                      href={`https://maps.apple.com/?ll=${selectedPlace.latitude},${selectedPlace.longitude}&q=${encodeURIComponent(selectedPlace.place_name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Apple Maps
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
