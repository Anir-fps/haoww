import { Link, useLocation } from "wouter";
import { UserButton, useAuth } from "@clerk/react";
import { motion } from "framer-motion";
import foxLogo from "/logo.png";

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
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            data-testid="nav-logo"
          >
            <motion.img
              src={foxLogo}
              alt="FoxPrompt"
              className="w-9 h-9 object-contain drop-shadow-[0_2px_8px_rgba(255,107,0,0.35)]"
              whileHover={{ rotate: [-2, 2, -2, 0], transition: { duration: 0.4 } }}
            />
            <span className="font-black text-lg tracking-tight">
              Fox<span className="text-primary">Prompt</span>
            </span>
          </motion.div>
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
