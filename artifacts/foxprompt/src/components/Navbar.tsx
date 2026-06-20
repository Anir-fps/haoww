import { Link, useLocation } from "wouter";
import { UserButton, useAuth } from "@clerk/react";
import { motion } from "framer-motion";
import { useState } from "react";
import foxLogo from "/logo.png";
import foxLogoHover from "/logo-hover.png";

export function Navbar() {
  const [location] = useLocation();
  const { isSignedIn } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [shineKey, setShineKey] = useState(0);
  const [shineDir, setShineDir] = useState<"in" | "out">("in");

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
            className="flex items-center gap-2 cursor-pointer select-none"
            data-testid="nav-logo"
            onHoverStart={() => { setHovered(true); setShineDir("in"); setShineKey(k => k + 1); }}
            onHoverEnd={() => { setHovered(false); setShineDir("out"); setShineKey(k => k + 1); }}
          >
            {/* Logo crossfade container */}
            <div
              className="relative w-9 h-9 overflow-hidden"
              style={{ borderRadius: 4 }}
            >
              {/* Default flat logo */}
              <motion.img
                src={foxLogo}
                alt="FoxPrompt"
                className="absolute inset-0 w-full h-full object-contain"
                animate={{ opacity: hovered ? 0 : 1, scale: hovered ? 0.85 : 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />

              {/* Hover detailed logo */}
              <motion.img
                src={foxLogoHover}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
                animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 1.1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />

              {/* Shine sweep — replays on both enter and leave */}
              {shineKey > 0 && (
                <motion.div
                  key={shineKey}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.6) 50%, transparent 75%)",
                    backgroundSize: "200% 100%",
                  }}
                  initial={{ backgroundPosition: shineDir === "in" ? "-100% 0" : "220% 0", opacity: 1 }}
                  animate={{ backgroundPosition: shineDir === "in" ? "220% 0" : "-100% 0", opacity: [1, 1, 0] }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              )}
            </div>

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
                <span
                  data-testid="nav-signin"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  Sign in
                </span>
              </Link>
              <Link href="/sign-up">
                <span
                  data-testid="nav-signup"
                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 cursor-pointer transition-colors"
                >
                  Get started
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/profile">
                <span
                  data-testid="nav-profile"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
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
