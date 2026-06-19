import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Flame, Sparkles, Star } from "lucide-react";
import { useListPrompts, useGetFeaturedPrompts, useGetTrendingPrompts, useListCategories, useGetPlatformStats, getListPromptsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { PromptCard } from "@/components/PromptCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", icon: Sparkles },
  { value: "trending", label: "Trending", icon: Flame },
  { value: "featured", label: "Featured", icon: Star },
];

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category ? { category } : {}),
    sort: sort as "newest" | "trending" | "featured",
    limit: 24,
  };

  const { data: promptsData, isLoading } = useListPrompts(params, {
    query: { queryKey: getListPromptsQueryKey(params) },
  });
  const { data: featured } = useGetFeaturedPrompts({ limit: 3 });
  const { data: categories } = useListCategories();
  const { data: stats } = useGetPlatformStats();

  const prompts = promptsData?.prompts ?? [];

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              Discover the world's best{" "}
              <span className="text-primary">AI prompts</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
              Copy, enhance, and share high-quality prompts for Midjourney, DALL-E, Stable Diffusion, and more.
            </p>
          </motion.div>

          {/* Stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <span><strong className="text-foreground">{stats.totalPrompts.toLocaleString()}</strong> prompts</span>
              <span><strong className="text-foreground">{stats.totalCopies.toLocaleString()}</strong> copies</span>
              <span><strong className="text-foreground">{stats.totalUsers.toLocaleString()}</strong> creators</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* Search + Filters */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              data-testid="input-search"
              type="search"
              placeholder="Search prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-card-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                data-testid={`button-sort-${value}`}
                onClick={() => setSort(value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  sort === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-card-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        {categories && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              data-testid="button-category-all"
              onClick={() => setCategory("")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                !category ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                data-testid={`button-category-${cat.slug}`}
                onClick={() => setCategory(category === cat.slug ? "" : cat.slug)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  category === cat.slug ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {cat.name} <span className="opacity-60">{cat.promptCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Masonry Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="masonry-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="masonry-item">
                <Skeleton className="w-full rounded-xl" style={{ height: `${200 + (i % 3) * 80}px` }} />
              </div>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No prompts found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {prompts.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <PromptCard
                  prompt={prompt}
                  onEnhance={(text) => setLocation(`/enhance?text=${encodeURIComponent(text)}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
