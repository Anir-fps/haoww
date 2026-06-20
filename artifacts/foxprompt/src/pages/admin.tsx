import { motion } from "framer-motion";
import { Star, StarOff, Trash2, Shield } from "lucide-react";
import {
  useListPrompts,
  useGetMyProfile,
  useToggleFeaturePrompt,
  useDeletePrompt,
  getListPromptsQueryKey,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { Navbar } from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function AdminPage() {
  const { isSignedIn } = useAuth();
  const { data: profile } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey(), enabled: !!isSignedIn },
  });
  const { data: promptsData, isLoading } = useListPrompts({ limit: 100 }, {
    query: { queryKey: getListPromptsQueryKey({ limit: 100 }) },
  });
  const toggleFeature = useToggleFeaturePrompt();
  const deletePrompt = useDeletePrompt();
  const { toast } = useToast();
  const qc = useQueryClient();

  const prompts = promptsData?.prompts ?? [];

  if (!isSignedIn || (profile && !profile.isAdmin)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Admin access required</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          <Link href="/">
            <span className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer">
              Back to feed
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleFeature = (id: number) => {
    toggleFeature.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListPromptsQueryKey() });
          toast({ title: "Updated", description: "Featured status changed" });
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this prompt?")) return;
    deletePrompt.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListPromptsQueryKey() });
          toast({ title: "Deleted", description: "Prompt removed" });
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-black">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">{prompts.length} prompts in the database</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Prompt</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Category</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Copies</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Featured</th>
                  <th className="text-center px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    data-testid={`row-prompt-${p.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-foreground">{p.title ?? p.text}</p>
                      <p className="text-xs text-muted-foreground truncate font-mono">{p.text.slice(0, 50)}...</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs">{p.categoryName}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.copyCount}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        data-testid={`button-feature-${p.id}`}
                        onClick={() => handleToggleFeature(p.id)}
                        disabled={toggleFeature.isPending}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        {p.isFeatured
                          ? <Star className="w-4 h-4 text-primary fill-primary" />
                          : <StarOff className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        data-testid={`button-delete-${p.id}`}
                        onClick={() => handleDelete(p.id)}
                        disabled={deletePrompt.isPending}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
