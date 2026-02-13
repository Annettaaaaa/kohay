import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { extractLocation } from "@/lib/api/ai";

interface ExtractedPlace {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  description?: string;
}

const Share = () => {
  const [searchParams] = useSearchParams();
  const sharedUrl = searchParams.get("url") || searchParams.get("text") || "";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractedPlace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sharedUrl) {
      // Extract URL from shared text (might contain extra text)
      const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        handleExtract(urlMatch[0]);
      }
    }
  }, [sharedUrl]);

  const handleExtract = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await extractLocation(url);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Couldn't extract location from this link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-lg border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center"
          >
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
          className="w-full max-w-sm text-center"
        >
          {loading && (
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  Extracting location…
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  AI is analyzing the link
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  Couldn't extract
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <a
                href="/"
                className="inline-block mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                Go to Kohay
              </a>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              <div className="h-16 w-16 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  Spot found!
                </h2>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border text-left space-y-2">
                <h3 className="font-bold text-foreground font-display text-lg">
                  {result.name}
                </h3>
                <p className="text-sm text-muted-foreground">{result.address}</p>
                <div className="flex flex-wrap gap-2 pt-1">
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
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                )}
              </div>
              <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                Save to My Map
              </button>
              <a
                href="/"
                className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Kohay
              </a>
            </div>
          )}

          {!loading && !error && !result && !sharedUrl && (
            <div className="space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  Share to Kohay
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your phone's Share button on any TikTok or Instagram reel to send it here.
                </p>
              </div>
              <a
                href="/"
                className="inline-block mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
              >
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
