import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, useAuth } from "@clerk/react";
import { useEffect } from "react";
import { useSyncUser } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import FeedPage from "@/pages/feed";
import EnhancePage from "@/pages/enhance";
import SubmitPage from "@/pages/submit";
import ProfilePage from "@/pages/profile";
import AdminPage from "@/pages/admin";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function UserSyncer() {
  const { isSignedIn } = useAuth();
  const syncUser = useSyncUser();
  useEffect(() => {
    if (isSignedIn) syncUser.mutate(undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={FeedPage} />
      <Route path="/enhance" component={EnhancePage} />
      <Route path="/submit" component={SubmitPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <UserSyncer />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
