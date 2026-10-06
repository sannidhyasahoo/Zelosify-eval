"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-3 bg-[#040506]/85 backdrop-blur-md border-b border-[#1b1c1e]">
      <div className="w-full max-w-6xl flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/assets/logos/main-logo.png"
            alt="Zelosify"
            className="h-7 w-auto object-contain"
          />
          <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#111214] border border-[#2f3031] text-[#9c9c9d]">
            Enterprise
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#9c9c9d]">
          <button
            onClick={() => scrollToSection("capabilities")}
            className="hover:text-white transition-colors"
          >
            Capabilities
          </button>
          <button
            onClick={() => scrollToSection("workflow")}
            className="hover:text-white transition-colors"
          >
            Workflow
          </button>
          <button
            onClick={() => scrollToSection("security")}
            className="hover:text-white transition-colors"
          >
            Security & Roles
          </button>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium text-[#e6e6e6] hover:text-white px-3 py-1.5 rounded transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-xs font-medium bg-[#e6e6e6] text-[#07080a] hover:bg-white px-3.5 py-1.5 rounded transition-all shadow-sm"
          >
            Get started
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-1.5 rounded text-[#9c9c9d] hover:text-white hover:bg-[#111214]"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#07080a] border-b border-[#2f3031] p-5 space-y-4">
          <nav className="flex flex-col gap-3 text-sm text-[#9c9c9d]">
            <button
              onClick={() => scrollToSection("capabilities")}
              className="text-left py-1 hover:text-white"
            >
              Capabilities
            </button>
            <button
              onClick={() => scrollToSection("workflow")}
              className="text-left py-1 hover:text-white"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection("security")}
              className="text-left py-1 hover:text-white"
            >
              Security & Roles
            </button>
          </nav>
          <div className="pt-3 border-t border-[#1b1c1e] flex flex-col gap-2">
            <Link
              href="/login"
              className="text-center text-sm py-2 text-white bg-[#111214] rounded border border-[#2f3031]"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-center text-sm py-2 font-medium bg-[#e6e6e6] text-[#07080a] rounded"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
