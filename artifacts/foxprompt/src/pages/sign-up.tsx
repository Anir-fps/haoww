import { SignUp } from "@clerk/react";
import foxLogo from "/logo.png";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <img src={foxLogo} alt="FoxPrompt" className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(255,107,0,0.6)]" />
          <span className="font-black text-2xl">Fox<span className="text-primary">Prompt</span></span>
        </div>
        <p className="text-muted-foreground text-sm">Join the community of AI artists</p>
      </div>
      <SignUp
        routing="hash"
        signInUrl="/sign-in"
        appearance={{
          variables: { colorPrimary: "#FF6B00", colorBackground: "#0F0F14" },
          elements: { card: "shadow-2xl border border-border", formButtonPrimary: "bg-primary hover:bg-primary/90" },
        }}
      />
    </div>
  );
}
