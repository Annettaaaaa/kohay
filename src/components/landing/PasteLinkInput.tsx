import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Loader2, MapPin, Sparkles, X, AlertCircle } from "lucide-react";
import { extractLocation } from "@/lib/api/ai";

interface ExtractedPlace {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  description?: string;
}

const PasteLinkInput = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedPlace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await extractLocation(url.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to extract location");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExtract();
  };

  const reset = () => {
    setUrl("");
    setResult(null);
    setError(null);
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
            Drop a TikTok or Instagram reel link and we'll extract the location automatically.
          </p>
        </motion.div>

        {/* Input area */}
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

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="mt-6 p-5 rounded-2xl bg-card border border-border shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground font-display text-lg">
                        {result.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{result.address}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {result.category}
                    </span>
                    {result.lat && result.lng && (
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        📍 {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                  {result.description && (
                    <p className="text-sm text-muted-foreground mt-2">{result.description}</p>
                  )}
                </div>
                <button
                  onClick={reset}
                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors shrink-0"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                  Save to My Map
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default PasteLinkInput;
