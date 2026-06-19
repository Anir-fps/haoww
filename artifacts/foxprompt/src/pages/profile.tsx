import { motion } from "framer-motion";
import { UserButton, useAuth } from "@clerk/react";
import { Copy, Grid2x2, Star } from "lucide-react";
import { useGetMyProfile, useGetMyPrompts, getGetMyProfileQueryKey, getGetMyPromptsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { PromptCard } from "@/components/PromptCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function ProfilePage() {
  const { isSignedIn } = useAuth();
  const { data: profile, isLoading: profileLoading } = useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey(), enabled: !!isSignedIn },
  });
  const { data: myPrompts, isLoading: promptsLoading } = useGetMyPrompts({
    query: { queryKey: getGetMyPromptsQueryKey(), enabled: !!isSignedIn },
  });

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background dark">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-bold mb-2">Sign in to view profile</h2>
          <Link href="/sign-in">
            <span className="inline-block mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer transition-colors">
              Sign in
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 mb-10"
        >
          <UserButton appearance={{ elements: { avatarBox: "w-16 h-16" } }} />
          <div>
            {profileLoading ? (
              <Skeleton className="h-7 w-40 mb-2" />
            ) : (
              <h1 className="text-2xl font-black">{profile?.username ?? "Prompt Creator"}</h1>
            )}
            {profile?.isPremium && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                <Star className="w-3 h-3 fill-primary" /> Premium
              </span>
            )}
          </div>
          <div className="ml-auto flex gap-6 text-center">
            <div data-testid="stat-prompts">
              <div className="text-2xl font-black text-primary">{profile?.promptCount ?? 0}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1"><Grid2x2 className="w-3 h-3" /> Prompts</div>
            </div>
          </div>
        </motion.div>

        {/* My Prompts */}
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Copy className="w-4 h-4 text-primary" /> My Prompts
        </h2>

        {promptsLoading ? (
          <div className="masonry-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="masonry-item">
                <Skeleton className="w-full h-48 rounded-xl" />
              </div>
            ))}
          </div>
        ) : !myPrompts?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <Grid2x2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No prompts yet</p>
            <Link href="/submit">
              <span className="inline-block mt-4 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 cursor-pointer transition-colors">
                Submit your first prompt
              </span>
            </Link>
          </div>
        ) : (
          <div className="masonry-grid">
            {myPrompts.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PromptCard prompt={prompt} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
