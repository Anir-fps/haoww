import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Sparkles, Check, Star, Heart, ExternalLink, ChevronDown } from "lucide-react";
import { useCopyPrompt, useLikePrompt } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { Prompt } from "@workspace/api-client-react";

interface PromptCardProps {
  prompt: Prompt;
  onEnhance?: (text: string) => void;
}

const AI_TOOLS = [
  {
    name: "ChatGPT",
    icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/openai.svg",
    color: "#10A37F",
    url: (text: string) => `https://chat.openai.com/?q=${encodeURIComponent(text)}`,
  },
  {
    name: "Gemini",
    icon: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    color: "#4285F4",
    url: (text: string) => `https://gemini.google.com/app?text=${encodeURIComponent(text)}`,
  },
  {
    name: "Grok",
    icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg",
    color: "#000000",
    url: (text: string) => `https://grok.com/?q=${encodeURIComponent(text)}`,
  },
];

function CreateMenu({ promptText }: { promptText: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        Create
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden min-w-[140px]"
          >
            {AI_TOOLS.map((tool) => (
              <a
                key={tool.name}
                href={tool.url(promptText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-gray-800 text-xs font-medium"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tool.color + "18" }}
                >
                  <img
                    src={tool.icon}
                    alt={tool.name}
                    className="w-3 h-3"
                    style={{ filter: tool.color === "#000000" ? "none" : `drop-shadow(0 0 0 ${tool.color})` }}
                  />
                </div>
                <span>{tool.name}</span>
                <ExternalLink className="w-2.5 h-2.5 text-gray-400 ml-auto" />
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PromptCard({ prompt, onEnhance }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);
  const copyMutation = useCopyPrompt();
  const likeMutation = useLikePrompt();
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const isLiked = optimisticLiked ?? prompt.isLikedByMe ?? false;
  const likeCount = optimisticCount ?? prompt.likeCount ?? 0;

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

  const handleLike = () => {
    if (!isSignedIn) {
      toast({ title: "Sign in to like prompts", variant: "destructive" });
      return;
    }
    const newLiked = !isLiked;
    const newCount = likeCount + (newLiked ? 1 : -1);
    setOptimisticLiked(newLiked);
    setOptimisticCount(newCount);
    likeMutation.mutate(
      { id: prompt.id },
      {
        onSuccess: (result) => {
          setOptimisticLiked(result.isLikedByMe);
          setOptimisticCount(result.likeCount);
          qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).includes("/api/prompts") });
        },
        onError: () => {
          setOptimisticLiked(null);
          setOptimisticCount(null);
        },
      },
    );
  };

  const handleEnhance = () => {
    if (onEnhance) onEnhance(prompt.text);
    else window.location.href = `/enhance?text=${encodeURIComponent(prompt.text)}`;
  };

  const promptText = prompt.enhancedText ?? prompt.text;

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
                  className="absolute inset-0 bg-black/75 flex flex-col justify-end p-3"
                >
                  <p className="text-white text-xs leading-relaxed line-clamp-4 font-mono mb-3">
                    {promptText}
                  </p>

                  {/* Like + copy count row */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      data-testid={`button-like-${prompt.id}`}
                      onClick={handleLike}
                      disabled={likeMutation.isPending}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isLiked
                          ? "bg-red-500/90 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform ${isLiked ? "scale-110" : ""}`}
                        fill={isLiked ? "currentColor" : "none"}
                      />
                      <span>{likeCount.toLocaleString()}</span>
                    </button>
                    <span className="text-white/50 text-xs">{prompt.copyCount.toLocaleString()} copies</span>
                  </div>

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
                    <CreateMenu promptText={promptText} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom bar — always visible */}
        <div className="p-3 space-y-2">
          {/* Prompt text preview */}
          <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-2">
            {promptText}
          </p>

          {/* Creator row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {prompt.authorName ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary uppercase flex-shrink-0">
                    {prompt.authorName.charAt(0)}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{prompt.authorName}</span>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
                    {prompt.categoryName}
                  </span>
                  {prompt.isFeatured && <Star className="w-3 h-3 text-primary fill-primary" />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                data-testid={`button-like-text-${prompt.id}`}
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs transition-all ${
                  isLiked ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                }`}
              >
                <Heart className="w-3 h-3" fill={isLiked ? "currentColor" : "none"} />
                <span>{likeCount.toLocaleString()}</span>
              </button>
              <button
                data-testid={`button-copy-text-${prompt.id}`}
                onClick={handleCopy}
                disabled={copyMutation.isPending}
                className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Create button — always visible */}
          <CreateMenuLight promptText={promptText} fullWidth />
        </div>
      </div>
    </motion.div>
  );
}

function CreateMenuLight({ promptText, fullWidth }: { promptText: string; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors border border-border ${fullWidth ? "w-full" : ""}`}
      >
        <Sparkles className="w-3 h-3 text-primary" />
        Create with AI
        <ChevronDown className={`w-3 h-3 transition-transform ml-auto ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden min-w-[140px]"
          >
            {AI_TOOLS.map((tool) => (
              <a
                key={tool.name}
                href={tool.url(promptText)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-gray-800 text-xs font-medium"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tool.color + "18" }}
                >
                  <img
                    src={tool.icon}
                    alt={tool.name}
                    className="w-3 h-3"
                  />
                </div>
                <span>{tool.name}</span>
                <ExternalLink className="w-2.5 h-2.5 text-gray-400 ml-auto" />
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
