import { SignIn } from "@clerk/react";
import { Zap } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background dark flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-black text-2xl">Fox<span className="text-primary">Prompt</span></span>
        </div>
        <p className="text-muted-foreground text-sm">Sign in to copy, submit, and enhance prompts</p>
      </div>
      <SignIn
        routing="hash"
        signUpUrl="/sign-up"
        appearance={{
          variables: { colorPrimary: "#FF6B00", colorBackground: "#0F0F14" },
          elements: { card: "shadow-2xl border border-border", formButtonPrimary: "bg-primary hover:bg-primary/90" },
        }}
      />
    </div>
  );
}
