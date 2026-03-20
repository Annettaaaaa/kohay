import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, AlertCircle, ArrowLeft, AlertTriangle, HelpCircle, Save, Check } from "lucide-react";
import { extractLocations, ExtractedPlace } from "@/lib/api/ai";
import { savePlaces } from "@/lib/api/places";

const confidenceConfig = {
  high:   { icon: CheckCircle2, label: "High confidence",   className: "bg-accent/15 text-accent" },
  medium: { icon: AlertTriangle, label: "Medium confidence", className: "bg-[hsl(var(--warm-gold))]/15 text-[hsl(var(--warm-gold))]" },
  low:    { icon: HelpCircle,    label: "Low confidence",    className: "bg-destructive/15 text-destructive" },
};

const categoryEmoji: Record<string, string> = {
  gym: "💪", food: "🍽️", cafe: "☕", library: "📚", museum: "🎨",
  park: "🌿", shopping: "🛍️", nightlife: "🎵", hotel: "🏨", beach: "🏖️", other: "📍",
};

const Share = () => {
  const [searchParams] = useSearchParams();
  const sharedUrl = searchParams.get("url") || searchParams.get("text") || "";
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<ExtractedPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [extractedUrl, setExtractedUrl] = useState("");

  useEffect(() => {
    if (sharedUrl) {
      const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        setExtractedUrl(urlMatch[0]);
        handleExtract(urlMatch[0]);
      }
    }
  }, [sharedUrl]);

  const handleExtract = async (url: string) => {
    setLoading(true);
    setError(null);
    setPlaces([]);
    setSaved(false);
    try {
      const results = await extractLocations(url);
      setPlaces(results);
    } catch (err: any) {
      setError(err.message || "Couldn't extract location from this link");
    } finally {
      setLoading(false);
    }
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
          source_url: extractedUrl,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-lg border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <a href="/" className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </a>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-display text-foreground">Kohay</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {loading && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">Extracting locations…</h2>
                <p className="text-sm text-muted-foreground mt-1">Analyzing the post with AI</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">Couldn't extract</h2>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <a href="/" className="inline-block mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                Go to Kohay
              </a>
            </div>
          )}

          {places.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-foreground font-display mt-3">
                  {places.length} spot{places.length !== 1 ? "s" : ""} found!
                </h2>
              </div>

              {/* Place cards */}
              <div className="space-y-3">
                {places.map((place, i) => {
                  const confidence = (place.confidence || "low") as "high" | "medium" | "low";
                  const conf = confidenceConfig[confidence];
                  const ConfIcon = conf.icon;
                  const emoji = categoryEmoji[place.category] || "📍";
                  return (
                    <div key={i} className="p-4 rounded-2xl bg-card border border-border text-left space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground font-display leading-tight">{place.place_name}</h3>
                          {place.address && <p className="text-sm text-muted-foreground mt-0.5">{place.address}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">
                          {place.category}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${conf.className}`}>
                          <ConfIcon className="h-3 w-3" />
                          {conf.label}
                        </span>
                      </div>
                      {place.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{place.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleSaveAll}
                disabled={saving || saved}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-accent/15 text-accent border-2 border-accent/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : saved ? (
                  <><Check className="h-4 w-4" /> Saved to map!</>
                ) : (
                  <><Save className="h-4 w-4" /> Save {places.length > 1 ? `all ${places.length} places` : "to my map"}</>
                )}
              </button>

              <a href="/" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Kohay
              </a>
            </div>
          )}

          {!loading && !error && places.length === 0 && !sharedUrl && (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">Share to Kohay</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your phone's Share button on any TikTok or Instagram reel to send it here.
                </p>
              </div>
              <a href="/" className="inline-block mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                Go to Kohay
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Share;
