import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Sparkles, Check, Star } from "lucide-react";
import { useCopyPrompt } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import type { Prompt } from "@workspace/api-client-react";

interface PromptCardProps {
  prompt: Prompt;
  onEnhance?: (text: string) => void;
}

export function PromptCard({ prompt, onEnhance }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const copyMutation = useCopyPrompt();
  const { toast } = useToast();

  const handleCopy = async () => {
    copyMutation.mutate(
      { id: prompt.id },
      {
        onSuccess: (result) => {
          const text = result.enhancedText ?? result.text;
          navigator.clipboard.writeText(text).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast({ title: "Copied!", description: "Prompt copied to clipboard" });
        },
      },
    );
  };

  const handleEnhance = () => {
    if (onEnhance) onEnhance(prompt.text);
    else window.location.href = `/enhance?text=${encodeURIComponent(prompt.text)}`;
  };

  return (
    <motion.div
      className="masonry-item"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      data-testid={`card-prompt-${prompt.id}`}
    >
      <div className="relative rounded-xl overflow-hidden bg-card border border-card-border neon-glow transition-all duration-300 group">
        {/* Image */}
        {prompt.imageUrl && (
          <div className="relative overflow-hidden">
            <img
              src={prompt.imageUrl}
              alt={prompt.title ?? "AI generated"}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Hover overlay */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/70 flex flex-col justify-end p-3"
                >
                  <p className="text-white text-xs leading-relaxed line-clamp-4 font-mono mb-2">
                    {prompt.enhancedText ?? prompt.text}
                  </p>
                  <div className="flex gap-2">
                    <button
                      data-testid={`button-copy-${prompt.id}`}
                      onClick={handleCopy}
                      disabled={copyMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      data-testid={`button-enhance-${prompt.id}`}
                      onClick={handleEnhance}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      Enhance
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom bar */}
        <div className="p-3">
          {!prompt.imageUrl && (
            <p className="text-sm text-foreground font-mono leading-relaxed mb-2 line-clamp-3">
              {prompt.enhancedText ?? prompt.text}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
                {prompt.categoryName}
              </span>
              {prompt.isFeatured && (
                <Star className="w-3 h-3 text-primary fill-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {prompt.copyCount.toLocaleString()} copies
              </span>
              {!prompt.imageUrl && (
                <button
                  data-testid={`button-copy-text-${prompt.id}`}
                  onClick={handleCopy}
                  disabled={copyMutation.isPending}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
