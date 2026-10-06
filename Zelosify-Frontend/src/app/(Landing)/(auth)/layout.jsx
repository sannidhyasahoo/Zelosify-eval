"use client";
import { motion } from "framer-motion";
import { memo } from "react";
import Link from "next/link";

/**
 * Shared shell for /login, /register and /setup-totp.
 * Void-black canvas, a restrained atmospheric glow, and one centered key-card.
 */
const AuthLayout = memo(({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-background">
    {/* atmosphere */}
    <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
    <div
      className="pointer-events-none absolute inset-0 bg-dots opacity-60"
      style={{
        maskImage:
          "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 75%)",
      }}
    />

    <header className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-5">
      <Link href="/" aria-label="Zelosify home" className="flex items-center">
        <img
          src="/assets/logos/main-logo.png"
          alt="Zelosify"
          className="h-7 w-auto"
        />
      </Link>
      <Link
        href="/"
        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to site
      </Link>
    </header>

    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] w-full max-w-md flex-col items-center justify-center px-4 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full"
      >
        {children}
      </motion.div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70">
        © {new Date().getFullYear()} Zelosify
      </p>
    </main>
  </div>
));
AuthLayout.displayName = "AuthLayout";

export default AuthLayout;
