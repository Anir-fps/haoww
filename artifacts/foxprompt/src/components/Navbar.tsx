import { Link, useLocation } from "wouter";
import { UserButton, useAuth } from "@clerk/react";
import { Zap } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const { isSignedIn } = useAuth();

  const navLinks = [
    { href: "/", label: "Discover" },
    { href: "/enhance", label: "Enhance" },
    { href: "/submit", label: "Submit" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 group cursor-pointer" data-testid="nav-logo">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-black text-lg tracking-tight">
              Fox<span className="text-primary">Prompt</span>
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}>
              <span
                data-testid={`nav-${label.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  location === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in">
                <span data-testid="nav-signin" className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  Sign in
                </span>
              </Link>
              <Link href="/sign-up">
                <span data-testid="nav-signup" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 cursor-pointer transition-colors">
                  Get started
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/profile">
                <span data-testid="nav-profile" className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  Profile
                </span>
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
