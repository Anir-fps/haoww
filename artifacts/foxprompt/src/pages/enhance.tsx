import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, ArrowRight, Wand2 } from "lucide-react";
import { useEnhancePrompt, EnhanceInputStyle } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const STYLES: { value: EnhanceInputStyle; label: string }[] = [
  { value: EnhanceInputStyle.photorealistic, label: "Photorealistic" },
  { value: EnhanceInputStyle.cinematic, label: "Cinematic" },
  { value: EnhanceInputStyle.anime, label: "Anime" },
  { value: EnhanceInputStyle.illustration, label: "Illustration" },
  { value: EnhanceInputStyle.abstract, label: "Abstract" },
];

export default function EnhancePage() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<EnhanceInputStyle>(EnhanceInputStyle.photorealistic);
  const [copied, setCopied] = useState(false);
  const enhanceMutation = useEnhancePrompt();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("text");
    if (t) setText(t);
  }, []);

  const handleEnhance = () => {
    if (!text.trim()) return;
    enhanceMutation.mutate(
      { data: { text: text.trim(), style } },
      {
        onError: () => toast({ title: "Enhancement failed", description: "Please try again", variant: "destructive" }),
      },
    );
  };

  const handleCopy = () => {
    if (!enhanceMutation.data?.enhanced) return;
    navigator.clipboard.writeText(enhanceMutation.data.enhanced).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Enhanced prompt copied to clipboard" });
  };

  const enhanced = enhanceMutation.data?.enhanced;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black">Prompt Enhancer</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Paste any basic prompt and watch AI transform it into a cinematic masterpiece.
          </p>
        </motion.div>

        {/* Style selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STYLES.map(({ value, label }) => (
            <button
              key={value}
              data-testid={`button-style-${value}`}
              onClick={() => setStyle(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                style === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <textarea
            data-testid="input-prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A fox in the woods..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-card border border-card-border text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground"
          />
          <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">{text.length} chars</span>
        </div>

        <button
          data-testid="button-enhance"
          onClick={handleEnhance}
          disabled={!text.trim() || enhanceMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enhanceMutation.isPending ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Enhance Prompt
            </>
          )}
        </button>

        {/* Before/After */}
        <AnimatePresence>
          {enhanced && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="mt-8 space-y-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <span className="px-2 py-0.5 rounded bg-secondary">Before</span>
                <ArrowRight className="w-4 h-4" />
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary">After</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary border border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Original</p>
                  <p className="text-sm font-mono leading-relaxed text-muted-foreground">{text}</p>
                </div>
                <div className="p-4 rounded-xl bg-accent border border-primary/30 relative">
                  <p className="text-xs text-primary font-medium mb-2 uppercase tracking-wide">Enhanced</p>
                  <p className="text-sm font-mono leading-relaxed" data-testid="text-enhanced">{enhanced}</p>
                  <button
                    data-testid="button-copy-enhanced"
                    onClick={handleCopy}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
