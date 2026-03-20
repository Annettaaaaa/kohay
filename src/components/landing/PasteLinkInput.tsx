import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Loader2, MapPin, Sparkles, X, AlertCircle,
  CheckCircle2, AlertTriangle, HelpCircle, Save, Check,
} from "lucide-react";
import { extractLocations, ExtractedPlace } from "@/lib/api/ai";
import { savePlaces } from "@/lib/api/places";
import { useAuth } from "@/hooks/useAuth";

const confidenceConfig = {
  high:   { icon: CheckCircle2, label: "High confidence",   className: "bg-accent/15 text-accent" },
  medium: { icon: AlertTriangle, label: "Medium confidence", className: "bg-[hsl(var(--warm-gold))]/15 text-[hsl(var(--warm-gold))]" },
  low:    { icon: HelpCircle,    label: "Low confidence",    className: "bg-destructive/15 text-destructive" },
};

const categoryEmoji: Record<string, string> = {
  gym: "💪", food: "🍽️", cafe: "☕", library: "📚", museum: "🎨",
  park: "🌿", shopping: "🛍️", nightlife: "🎵", hotel: "🏨", beach: "🏖️", other: "📍",
};

const PasteLinkInput = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<ExtractedPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleExtract = async () => {
    if (!url.trim()) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(true);
    setError(null);
    setPlaces([]);
    setSaved(false);

    try {
      const results = await extractLocations(url.trim());
      setPlaces(results);
    } catch (err: any) {
      setError(err.message || "Failed to extract location");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExtract();
  };

  const handleSaveAll = async () => {
    if (places.length === 0 || saving || saved) return;
    setSaving(true);
    try {
      await savePlaces(
        places.map((p) => ({
          place_name: p.place_name,
          category: p.category,
          address: p.address,
          latitude: p.latitude,
          longitude: p.longitude,
          description: p.description,
          confidence: p.confidence,
          source_url: url,
          source_caption: p.source_caption,
          source_username: p.source_username,
          platform: p.platform,
        }))
      );
      setSaved(true);
      window.dispatchEvent(new Event("kohay:places-updated"));
    } catch (err: any) {
      setError(err.message || "Failed to save places");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setUrl("");
    setPlaces([]);
    setError(null);
    setSaved(false);
  };

  return (
    <section className="py-16 bg-background" id="paste-link">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered Extraction
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-3">
            Paste a link, get the spot
          </h2>
          <p className="text-muted-foreground">
            Drop a TikTok or Instagram link and we'll extract every place mentioned — automatically saved to your map.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://www.tiktok.com/@user/video/..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                disabled={loading}
              />
              {url && !loading && (
                <button
                  onClick={reset}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={handleExtract}
              disabled={!url.trim() || loading}
              className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Extract
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Extraction failed</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {places.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {places.length} place{places.length !== 1 ? "s" : ""} found
                </p>
                <button
                  onClick={reset}
                  className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Place cards */}
              {places.map((place, i) => {
                const confidence = (place.confidence || "low") as "high" | "medium" | "low";
                const conf = confidenceConfig[confidence];
                const ConfIcon = conf.icon;
                const emoji = categoryEmoji[place.category] || "📍";

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-2xl bg-card border border-border shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl shrink-0">
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground font-display leading-tight">
                          {place.place_name}
                        </h3>
                        {place.address && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">{place.address}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">
                            {place.category}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${conf.className}`}>
                            <ConfIcon className="h-3 w-3" />
                            {conf.label}
                          </span>
                          {place.latitude && place.longitude && (
                            <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                              {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
                            </span>
                          )}
                        </div>
                        {place.description && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                            {place.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Save all button */}
              <motion.button
                onClick={handleSaveAll}
                disabled={saving || saved}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-accent/15 text-accent border-2 border-accent/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                } disabled:opacity-70 disabled:cursor-not-allowed`}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving to map…
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved to your map!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save {places.length > 1 ? `all ${places.length} places` : "to my map"}
                  </>
                )}
              </motion.button>

              {saved && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-muted-foreground"
                >
                  Scroll down to see them on your map ↓
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default PasteLinkInput;
